;;; sdcdb.el --- run sdcdb under Emacs

;; Author: W. Schelter, University of Texas
;;     wfs@rascal.ics.utexas.edu
;; Rewritten by rms.
;; Keywords: c, unix, tools, debugging

;; Some ideas are due to Masanobu.

;; This file is part of XEmacs.

;; XEmacs is free software; you can redistribute it and/or modify it
;; under the terms of the GNU General Public License as published by
;; the Free Software Foundation; either version 2, or (at your option)
;; any later version.

;; XEmacs is distributed in the hope that it will be useful, but
;; WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
;; General Public License for more details.

;; You should have received a copy of the GNU General Public License
;; along with XEmacs; see the file COPYING.  If not, write to the Free
;; Software Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA
;; 02111-1307, USA.

;;; Synched up with: Not in FSF

;;; Commentary:

;; Description of SDCDB interface:

;; A facility is provided for the simultaneous display of the source code
;; in one window, while using sdcdb to step through a function in the
;; other.  A small arrow in the source window, indicates the current
;; line.

;; Starting up:

;; In order to use this facility, invoke the command SDCDB to obtain a
;; shell window with the appropriate command bindings.  You will be asked
;; for the name of a file to run.  Sdcdb will be invoked on this file, in a
;; window named *sdcdb-foo* if the file is foo.

;; M-s steps by one line, and redisplays the source file and line.

;; You may easily create additional commands and bindings to interact
;; with the display.  For example to put the sdcdb command next on \M-n
;; (def-sdcdb next "\M-n")

;; This causes the emacs command sdcdb-next to be defined, and runs
;; sdcdb-display-frame after the command.

;; sdcdb-display-frame is the basic display function.  It tries to display
;; in the other window, the file and line corresponding to the current
;; position in the sdcdb window.  For example after a sdcdb-step, it would
;; display the line corresponding to the position for the last step.  Or
;; if you have done a backtrace in the sdcdb buffer, and move the cursor
;; into one of the frames, it would display the position corresponding to
;; that frame.

;; sdcdb-display-frame is invoked automatically when a filename-and-line-number
;; appears in the output.

;;; Code:

(require 'comint)
(require 'shell)

(condition-case nil
    (if (featurep 'toolbar)
	(require 'eos-toolbar "sun-eos-toolbar"))
  (error nil))

(defvar sdcdb-last-frame)
(defvar sdcdb-delete-prompt-marker)
(defvar sdcdb-filter-accumulator)
(defvar sdcdb-last-frame-displayed-p)
(defvar sdcdb-arrow-extent nil)
(or (fboundp 'make-glyph) (fset 'make-glyph 'identity)) ; work w/ pre beta v12
(defvar sdcdb-arrow-glyph (make-glyph "=>"))

(make-face 'sdcdb-arrow-face)
(or (face-differs-from-default-p 'sdcdb-arrow-face)
   ;; Usually has a better default value than highlight does
   (copy-face 'isearch 'sdcdb-arrow-face))

;; Hooks can side-effect extent arg to change extent properties
(defvar sdcdb-arrow-extent-hooks '())

(defvar sdcdb-prompt-pattern "^>\\|^(.*sdcdb[+]?) *\\|^---Type <return> to.*--- *"
  "A regexp to recognize the prompt for sdcdb or sdcdb+.") 

(defvar sdcdb-mode-map nil
  "Keymap for sdcdb-mode.")

(defvar sdcdb-toolbar nil)
 
(if sdcdb-mode-map
   nil
  (setq sdcdb-mode-map (make-sparse-keymap))
  (set-keymap-name sdcdb-mode-map 'sdcdb-mode-map)
  (set-keymap-parents sdcdb-mode-map (list comint-mode-map))
  (define-key sdcdb-mode-map "\C-l" 'sdcdb-refresh)
  (define-key sdcdb-mode-map "\C-c\C-c" 'sdcdb-control-c-subjob)
  (define-key sdcdb-mode-map "\t" 'comint-dynamic-complete)
  (define-key sdcdb-mode-map "\M-?" 'comint-dynamic-list-completions))

(define-key ctl-x-map " " 'sdcdb-break)
(define-key ctl-x-map "&" 'send-sdcdb-command)

;;Of course you may use `def-sdcdb' with any other sdcdb command, including
;;user defined ones.   

(defmacro def-sdcdb (name key &optional doc &rest forms)
  (let* ((fun (intern (format "sdcdb-%s" name)))
	 (cstr (list 'if '(not (= 1 arg))
		     (list 'format "%s %s" name 'arg)
		     name)))
    (list 'progn
	  (nconc (list 'defun fun '(arg)
		       (or doc "")
		       '(interactive "p")
		       (list 'sdcdb-call cstr))
		 forms)
	  (and key (list 'define-key 'sdcdb-mode-map key  (list 'quote fun))))))

(def-sdcdb "step"   "\M-s" "Step one source line with display"
  (sdcdb-delete-arrow-extent))
(def-sdcdb "stepi"  "\M-i" "Step one instruction with display"
  (sdcdb-delete-arrow-extent))
(def-sdcdb "finish" "\C-c\C-f" "Finish executing current function"
  (sdcdb-delete-arrow-extent))
(def-sdcdb "run" nil "Run the current program"
  (sdcdb-delete-arrow-extent))

;;"next" and "cont" were bound to M-n and M-c in Emacs 18, but these are
;;poor choices, since M-n is used for history navigation and M-c is
;;capitalize-word.  These are defined without key bindings so that users
;;may choose their own bindings.
(def-sdcdb "next"   "\C-c\C-n" "Step one source line (skip functions)"
  (sdcdb-delete-arrow-extent))
(def-sdcdb "cont"   "\C-c\M-c" "Proceed with the program"
  (sdcdb-delete-arrow-extent))

(def-sdcdb "up"     "\C-c<" "Go up N stack frames (numeric arg) with display")
(def-sdcdb "down"   "\C-c>" "Go down N stack frames (numeric arg) with display")

(defvar sdcdb-display-mode nil
  "Minor mode for sdcdb frame display")
(or (assq 'sdcdb-display-mode minor-mode-alist)
    (setq minor-mode-alist
	  (purecopy
	   (append minor-mode-alist
		   '((sdcdb-display-mode " Frame"))))))

(defun sdcdb-display-mode (&optional arg)
  "Toggle SDCDB Frame display mode
With arg, turn display mode on if and only if arg is positive.
In the display minor mode, source file are displayed in another
window for repective \\[sdcdb-display-frame] commands."
  (interactive "P")
  (setq sdcdb-display-mode (if (null arg)
			     (not sdcdb-display-mode)
			   (> (prefix-numeric-value arg) 0))))

;; Using cc-mode's syntax table is broken.
(defvar sdcdb-mode-syntax-table nil
  "Syntax table for SDCDB mode.")

;; This is adapted from CC Mode 5.11.
(unless sdcdb-mode-syntax-table
  (setq sdcdb-mode-syntax-table (make-syntax-table))
  ;; DO NOT TRY TO SET _ (UNDERSCORE) TO WORD CLASS!
  (modify-syntax-entry ?_  "_" sdcdb-mode-syntax-table)
  (modify-syntax-entry ?\\ "\\" sdcdb-mode-syntax-table)
  (modify-syntax-entry ?+  "." sdcdb-mode-syntax-table)
  (modify-syntax-entry ?-  "." sdcdb-mode-syntax-table)
  (modify-syntax-entry ?=  "." sdcdb-mode-syntax-table)
  (modify-syntax-entry ?%  "." sdcdb-mode-syntax-table)
  (modify-syntax-entry ?<  "." sdcdb-mode-syntax-table)
  (modify-syntax-entry ?>  "." sdcdb-mode-syntax-table)
  (modify-syntax-entry ?&  "." sdcdb-mode-syntax-table)
  (modify-syntax-entry ?|  "." sdcdb-mode-syntax-table)
  (modify-syntax-entry ?\' "\"" sdcdb-mode-syntax-table)
  ;; add extra comment syntax
  (modify-syntax-entry ?/  ". 14"  sdcdb-mode-syntax-table)
  (modify-syntax-entry ?*  ". 23"  sdcdb-mode-syntax-table))


(defun sdcdb-mode ()
  "Major mode for interacting with an inferior Sdcdb process.
The following commands are available:

\\{sdcdb-mode-map}

\\[sdcdb-display-frame] displays in the other window
the last line referred to in the sdcdb buffer. See also
\\[sdcdb-display-mode].

\\[sdcdb-step],\\[sdcdb-next], and \\[sdcdb-nexti] in the sdcdb window,
call sdcdb to step,next or nexti and then update the other window
with the current file and position.

If you are in a source file, you may select a point to break
at, by doing \\[sdcdb-break].

Commands:
Many commands are inherited from comint mode. 
Additionally we have:

\\[sdcdb-display-frame] display frames file in other window
\\[sdcdb-step] advance one line in program
\\[send-sdcdb-command] used for special printing of an arg at the current point.
C-x SPACE sets break point at current line."
  (interactive)
  (comint-mode)
  (use-local-map sdcdb-mode-map)
  (set-syntax-table sdcdb-mode-syntax-table)
  (make-local-variable 'sdcdb-last-frame-displayed-p)
  (make-local-variable 'sdcdb-last-frame)
  (make-local-variable 'sdcdb-delete-prompt-marker)
  (make-local-variable 'sdcdb-display-mode)
  (make-local-variable' sdcdb-filter-accumulator)
  (setq sdcdb-last-frame nil
        sdcdb-delete-prompt-marker nil
        sdcdb-filter-accumulator nil
	sdcdb-display-mode t
        major-mode 'sdcdb-mode
        mode-name "Inferior SDCDB"
        comint-prompt-regexp sdcdb-prompt-pattern
        sdcdb-last-frame-displayed-p t)
  (set (make-local-variable 'shell-dirtrackp) t)
  ;;(make-local-variable 'sdcdb-arrow-extent)
  (and (extentp sdcdb-arrow-extent)
       (delete-extent sdcdb-arrow-extent))
  (setq sdcdb-arrow-extent nil)
  ;; XEmacs change:
  (make-local-hook 'kill-buffer-hook)
  (add-hook 'kill-buffer-hook 'sdcdb-delete-arrow-extent nil t)
  (add-hook 'comint-input-filter-functions 'shell-directory-tracker nil t)
  (run-hooks 'sdcdb-mode-hook))

(defun sdcdb-delete-arrow-extent ()
  (let ((inhibit-quit t))
    (if sdcdb-arrow-extent
        (delete-extent sdcdb-arrow-extent))
    (setq sdcdb-arrow-extent nil)))

(defvar current-sdcdb-buffer nil)

;;;###autoload
(defvar sdcdb-command-name "sdcdb"
  "Pathname for executing sdcdb.")

;;;###autoload
(defun sdcdb (path &optional corefile)
  "Run sdcdb on program FILE in buffer *sdcdb-FILE*.
The directory containing FILE becomes the initial working directory
and source-file directory for SDCDB.  If you wish to change this, use
the SDCDB commands `cd DIR' and `directory'."
  (interactive "FRun sdcdb on file: ")
  (setq path (file-truename (expand-file-name path)))
  (let ((file (file-name-nondirectory path)))
    (switch-to-buffer (concat "*sdcdb-" file "*"))
    (setq default-directory (file-name-directory path))
    (or (bolp) (newline))
    (insert "Current directory is " default-directory "\n")
    (apply 'make-comint
	   (concat "sdcdb-" file)
	   (substitute-in-file-name sdcdb-command-name)
	   nil
	   "-fullname"
	   "-cd" default-directory
	   file
	   (and corefile (list corefile)))
    (set-process-filter (get-buffer-process (current-buffer)) 'sdcdb-filter)
    (set-process-sentinel (get-buffer-process (current-buffer)) 'sdcdb-sentinel)
    ;; XEmacs change: turn on sdcdb mode after setting up the proc filters
    ;; for the benefit of shell-font.el
    (sdcdb-mode)
    (sdcdb-set-buffer)))

;;;###autoload
(defun sdcdb-with-core (file corefile)
  "Debug a program using a corefile."
  (interactive "fProgram to debug: \nfCore file to use: ")
  (sdcdb file corefile))

(defun sdcdb-set-buffer ()
  (cond ((eq major-mode 'sdcdb-mode)
	 (setq current-sdcdb-buffer (current-buffer))
	 (if (featurep 'eos-toolbar)
	     (set-specifier default-toolbar (cons (current-buffer)
						  sdcdb-toolbar))))))


;; This function is responsible for inserting output from SDCDB
;; into the buffer.
;; Aside from inserting the text, it notices and deletes
;; each filename-and-line-number;
;; that SDCDB prints to identify the selected frame.
;; It records the filename and line number, and maybe displays that file.
(defun sdcdb-filter (proc string)
  (let ((inhibit-quit t))
    (save-current-buffer
     (set-buffer (process-buffer proc))
     (if sdcdb-filter-accumulator
	 (sdcdb-filter-accumulate-marker
	  proc (concat sdcdb-filter-accumulator string))
       (sdcdb-filter-scan-input proc string)))))

(defun sdcdb-filter-accumulate-marker (proc string)
  (setq sdcdb-filter-accumulator nil)
  (if (> (length string) 1)
      (if (= (aref string 1) ?\032)
	  (let ((end (string-match "\n" string)))
	    (if end
		(progn
		  (let* ((first-colon (string-match ":" string 2))
			 (second-colon
			  (string-match ":" string (1+ first-colon))))
		    (setq sdcdb-last-frame
			  (cons (substring string 2 first-colon)
				(string-to-int
				 (substring string (1+ first-colon)
					    second-colon)))))
		  (setq sdcdb-last-frame-displayed-p nil)
		  (sdcdb-filter-scan-input proc
					 (substring string (1+ end))))
	      (setq sdcdb-filter-accumulator string)))
	(sdcdb-filter-insert proc "\032")
	(sdcdb-filter-scan-input proc (substring string 1)))
    (setq sdcdb-filter-accumulator string)))

(defun sdcdb-filter-scan-input (proc string)
  (if (equal string "")
      (setq sdcdb-filter-accumulator nil)
    (let ((start (string-match "\032" string)))
      (if start
	  (progn (sdcdb-filter-insert proc (substring string 0 start))
		 (sdcdb-filter-accumulate-marker proc
					       (substring string start)))
	(sdcdb-filter-insert proc string)))))

(defun sdcdb-filter-insert (proc string)
  (let ((moving (= (point) (process-mark proc)))
	(output-after-point (< (point) (process-mark proc))))
    (save-excursion
      ;; Insert the text, moving the process-marker.
      (goto-char (process-mark proc))
      (insert-before-markers string)
      (set-marker (process-mark proc) (point))
      (sdcdb-maybe-delete-prompt)
      ;; Check for a filename-and-line number.
      (sdcdb-display-frame
       ;; Don't display the specified file
       ;; unless (1) point is at or after the position where output appears
       ;; and (2) this buffer is on the screen.
       (or output-after-point
           (not (get-buffer-window (current-buffer))))
       ;; Display a file only when a new filename-and-line-number appears.
       t))
    (if moving (goto-char (process-mark proc))))

  (let (s)
    (if (and (should-use-dialog-box-p)
	     (setq s (or (string-match " (y or n) *\\'" string)
			 (string-match " (yes or no) *\\'" string))))
	(sdcdb-mouse-prompt-hack (substring string 0 s) (current-buffer))))
  )

(defun sdcdb-mouse-prompt-hack (prompt buffer)
  (popup-dialog-box
   (list prompt
	 (vector "Yes"    (list 'sdcdb-mouse-prompt-hack-answer 't   buffer) t)
	 (vector "No"     (list 'sdcdb-mouse-prompt-hack-answer 'nil buffer) t)
	 nil
	 (vector "Cancel" (list 'sdcdb-mouse-prompt-hack-answer 'nil buffer) t)
	 )))

(defun sdcdb-mouse-prompt-hack-answer (answer buffer)
  (let ((b (current-buffer)))
    (unwind-protect
	(progn
	  (set-buffer buffer)
	  (goto-char (process-mark (get-buffer-process buffer)))
	  (delete-region (point) (point-max))
	  (insert (if answer "yes" "no"))
	  (comint-send-input))
      (set-buffer b))))

(defun sdcdb-sentinel (proc msg)
  (cond ((null (buffer-name (process-buffer proc)))
	 ;; buffer killed
	 ;; Stop displaying an arrow in a source file.
	 ;(setq overlay-arrow-position nil) -- done by kill-buffer-hook
	 (set-process-buffer proc nil))
	((memq (process-status proc) '(signal exit))
	 ;; Stop displaying an arrow in a source file.
         (sdcdb-delete-arrow-extent)
	 ;; Fix the mode line.
	 (setq modeline-process
	       (concat ": sdcdb " (symbol-name (process-status proc))))
	 (let* ((obuf (current-buffer)))
	   ;; save-excursion isn't the right thing if
	   ;;  process-buffer is current-buffer
	   (unwind-protect
	       (progn
		 ;; Write something in *compilation* and hack its mode line,
		 (set-buffer (process-buffer proc))
		 ;; Force mode line redisplay soon
		 (set-buffer-modified-p (buffer-modified-p))
		 (if (eobp)
		     (insert ?\n mode-name " " msg)
		   (save-excursion
		     (goto-char (point-max))
		     (insert ?\n mode-name " " msg)))
		 ;; If buffer and mode line will show that the process
		 ;; is dead, we can delete it now.  Otherwise it
		 ;; will stay around until M-x list-processes.
		 (delete-process proc))
	     ;; Restore old buffer, but don't restore old point
	     ;; if obuf is the sdcdb buffer.
	     (set-buffer obuf))))))


(defun sdcdb-refresh (&optional arg)
  "Fix up a possibly garbled display, and redraw the arrow."
  (interactive "P")
  (recenter arg)
  (sdcdb-display-frame))

(defun sdcdb-display-frame (&optional nodisplay noauto)
  "Find, obey and delete the last filename-and-line marker from SDCDB.
The marker looks like \\032\\032FILENAME:LINE:CHARPOS\\n.
Obeying it means displaying in another window the specified file and line."
  (interactive)
  (sdcdb-set-buffer)
  (and sdcdb-last-frame (not nodisplay)
       sdcdb-display-mode
       (or (not sdcdb-last-frame-displayed-p) (not noauto))
       (progn (sdcdb-display-line (car sdcdb-last-frame) (cdr sdcdb-last-frame))
	      (setq sdcdb-last-frame-displayed-p t))))

;; Make sure the file named TRUE-FILE is in a buffer that appears on the screen
;; and that its line LINE is visible.
;; Put the overlay-arrow on the line LINE in that buffer.

(defun sdcdb-display-line (true-file line &optional select-method)
  ;; FILE to display
  ;; LINE number to highlight and make visible
  ;; SELECT-METHOD 'source, 'debugger, or 'none.  (default is 'debugger)
  (and (null select-method) (setq select-method 'debugger))
  (let* ((pre-display-buffer-function nil) ; screw it, put it all in one screen
	 (pop-up-windows t)
	 (source-buffer (find-file-noselect true-file))
	 (source-window (display-buffer source-buffer))
	 (debugger-window (get-buffer-window current-sdcdb-buffer))
         (extent sdcdb-arrow-extent)
	 pos)
    ;; XEmacs change: make sure we find a window displaying the source file
    ;; even if we are already sitting in it when a breakpoint is hit.
    ;; Otherwise the t argument to display-buffer will prevent it from being
    ;; displayed.
    (save-excursion 
      (cond ((eq select-method 'debugger)
	     ;; might not already be displayed
	     (setq debugger-window (display-buffer current-sdcdb-buffer))
	     (select-window debugger-window))
	    ((eq select-method 'source)
	     (select-window source-window))))
    (and extent
	 (not (eq (extent-object extent) source-buffer))
	 (setq extent (delete-extent extent)))
    (or extent
        (progn
          (setq extent (make-extent 1 1 source-buffer))
          (set-extent-face extent 'sdcdb-arrow-face)
	  (set-extent-begin-glyph extent sdcdb-arrow-glyph)
          (set-extent-begin-glyph-layout extent 'whitespace)
          (set-extent-priority extent 2000)
          (setq sdcdb-arrow-extent extent)))
    (save-current-buffer
      (set-buffer source-buffer)
      (save-restriction
	(widen)
	(goto-line line)
	(set-window-point source-window (point))
	(setq pos (point))
        (end-of-line)
        (set-extent-endpoints extent pos (point))
        (run-hook-with-args 'sdcdb-arrow-extent-hooks extent))
      (cond ((or (< pos (point-min)) (> pos (point-max)))
	     (widen)
	     (goto-char pos))))
    ;; Added by Stig.  It caused lots of problems for several users
    ;; and since its purpose is unclear it is getting commented out.
    ;;(and debugger-window
    ;; (set-window-point debugger-window pos))
    ))

(defun sdcdb-call (command)
  "Invoke sdcdb COMMAND displaying source in other window."
  (interactive)
  (goto-char (point-max))
  ;; Record info on the last prompt in the buffer and its position.
  ;; This is used in  sdcdb-maybe-delete-prompt
  ;; to prevent multiple prompts from accumulating.
  (save-excursion
    (goto-char (process-mark (get-buffer-process current-sdcdb-buffer)))
    (let ((pt (point)))
      (beginning-of-line)
      (setq sdcdb-delete-prompt-marker
	    (if (= (point) pt)
		nil
	      (list (point-marker) (- pt (point))
		    (buffer-substring (point) pt))))))
  (sdcdb-set-buffer)
  (process-send-string (get-buffer-process current-sdcdb-buffer)
	       (concat command "\n")))

(defun sdcdb-maybe-delete-prompt ()
  (if sdcdb-delete-prompt-marker
      ;; Get the string that we used as the prompt before.
      (let ((prompt (nth 2 sdcdb-delete-prompt-marker))
	    (length (nth 1 sdcdb-delete-prompt-marker)))
	;; Position after it.
	(goto-char (+ (car sdcdb-delete-prompt-marker) length))
	;; Delete any duplicates of it which follow right after.
	(while (and (<= (+ (point) length) (point-max))
		    (string= prompt
			     (buffer-substring (point) (+ (point) length))))
	  (delete-region (point) (+ (point) length)))
	;; If that didn't take us to where output is arriving,
	;; we have encountered something other than a prompt,
	;; so stop trying to delete any more prompts.
	(if (not (= (point)
		    (process-mark (get-buffer-process current-sdcdb-buffer))))
	    (progn
	      (set-marker (car sdcdb-delete-prompt-marker) nil)
	      (setq sdcdb-delete-prompt-marker nil))))))

(defun sdcdb-break (temp)
  "Set SDCDB breakpoint at this source line.  With ARG set temporary breakpoint."
  (interactive "P")
  (let* ((file-name (file-name-nondirectory buffer-file-name))
	 (line (save-restriction
		 (widen)
		 (beginning-of-line)
		 (1+ (count-lines 1 (point)))))
	 (cmd (concat (if temp "tbreak " "break ") file-name ":"
		      (int-to-string line))))
    (set-buffer current-sdcdb-buffer)
    (goto-char (process-mark (get-buffer-process current-sdcdb-buffer)))
    (delete-region (point) (point-max))
    (insert cmd)
    (comint-send-input)
    ;;(process-send-string (get-buffer-process current-sdcdb-buffer) cmd)
    ))

(defun sdcdb-clear ()
  "Set SDCDB breakpoint at this source line."
  (interactive)
  (let* ((file-name (file-name-nondirectory buffer-file-name))
	 (line (save-restriction
		 (widen)
		 (beginning-of-line)
		 (1+ (count-lines 1 (point)))))
	 (cmd (concat "clear " file-name ":"
		      (int-to-string line))))
    (set-buffer current-sdcdb-buffer)
    (goto-char (process-mark (get-buffer-process current-sdcdb-buffer)))
    (delete-region (point) (point-max))
    (insert cmd)
    (comint-send-input)
    ;;(process-send-string (get-buffer-process current-sdcdb-buffer) cmd)
    ))

(defun sdcdb-read-address()
  "Return a string containing the core-address found in the buffer at point."
  (save-excursion
   (let ((pt (point)) found begin)
     (setq found (if (search-backward "0x" (- pt 7) t)(point)))
     (cond (found (forward-char 2)
		  (buffer-substring found
				    (progn (re-search-forward "[^0-9a-f]")
					   (forward-char -1)
					   (point))))
	   (t (setq begin (progn (re-search-backward "[^0-9]") (forward-char 1)
				 (point)))
	      (forward-char 1)
	      (re-search-forward "[^0-9]")
	      (forward-char -1)
	      (buffer-substring begin (point)))))))


(defvar sdcdb-commands nil
  "List of strings or functions used by send-sdcdb-command.
It is for customization by you.")

(defun send-sdcdb-command (arg)

  "This command reads the number where the cursor is positioned.  It
 then inserts this ADDR at the end of the sdcdb buffer.  A numeric arg
 selects the ARG'th member COMMAND of the list sdcdb-print-command.  If
 COMMAND is a string, (format COMMAND ADDR) is inserted, otherwise
 (funcall COMMAND ADDR) is inserted.  eg. \"p (rtx)%s->fld[0].rtint\"
 is a possible string to be a member of sdcdb-commands.  "


  (interactive "P")
  (let (comm addr)
    (if arg (setq comm (nth arg sdcdb-commands)))
    (setq addr (sdcdb-read-address))
    (if (eq (current-buffer) current-sdcdb-buffer)
	(set-mark (point)))
    (cond (comm
	   (setq comm
		 (if (stringp comm) (format comm addr) (funcall comm addr))))
	  (t (setq comm addr)))
    (switch-to-buffer current-sdcdb-buffer)
    (goto-char (point-max))
    (insert comm)))

(fset 'sdcdb-control-c-subjob 'comint-interrupt-subjob)

;(defun sdcdb-control-c-subjob ()
;  "Send a Control-C to the subprocess."
;  (interactive)
;  (process-send-string (get-buffer-process (current-buffer))
;		       "\C-c"))

(defun sdcdb-toolbar-break ()
  (interactive)
  (save-excursion
    (message (car sdcdb-last-frame))
    (set-buffer (find-file-noselect (car sdcdb-last-frame)))
    (sdcdb-break nil)))

(defun sdcdb-toolbar-clear ()
  (interactive)
  (save-excursion
    (message (car sdcdb-last-frame))
    (set-buffer (find-file-noselect (car sdcdb-last-frame)))
    (sdcdb-clear)))

(provide 'sdcdb)

;;; sdcdb.el ends here
