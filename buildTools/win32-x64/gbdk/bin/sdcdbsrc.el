;;; sdcdbsrc.el -- Source-based (as opposed to comint-based) debugger
;;      interaction mode eventually, this will be unified with GUD
;; 	(after gud works reliably w/ XEmacs...)
;; Keywords: c, unix, tools, debugging

;; Copyright (C) 1990 Debby Ayers <ayers@austin.ibm.com>, and
;;		      Rich Schaefer <schaefer@asc.slb.com>
;; Copyright (C) 1994, 1995 Tinker Systems and INS Engineering Corp.
;; 
;; Copyright (C) 1999 Sandeep Dutta <sandeep.dutta@usa.net>
;;
;; This file is part of XEmacs.
;; 
;; XEmacs is free software; you can redistribute it and/or modify
;; it under the terms of the GNU General Public License as published by
;; the Free Software Foundation; either version 2 of the License, or
;; (at your option) any later version.
;; 
;; XEmacs is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; GNU General Public License for more details.
;; 
;; You should have received a copy of the GNU General Public License
;; along with XEmacs; if not, write to the Free Software
;; Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

;; Based upon code for version18 by Debra Ayers <ayers@austin.ibm.com>

;;;  SDCDBSRC::
;;;  Sdcdbsrc extends the emacs SDCDB interface to accept sdcdb commands issued
;;;  from the source code buffer.  Sdcdbsrc behaves similar to sdcdb except
;;;  now most debugging may be done from the source code using the *sdcdb*
;;;  buffer to view output. Supports a point and click model under X to
;;;  evaluate source code expressions (no more typing long variable names).
;;; 
;;; Supports C source at the moment but C++ support will be added if there
;;; is sufficient interest.
;;; 

;; SDCDBSRC::Sdcdb Source Mode Interface description.
;; Sdcdbsrc extends the emacs SDCDB interface to accept sdcdb commands issued
;; from the source code buffer. Sdcdbsrc behaves similar to sdcdb except now all 
;; debugging may be done from the currently focused source buffer using 
;; the *sdcdb* buffer to view output.

;; When source files are displayed through sdcdbsrc, buffers are put in 
;; sdcdbsrc-mode minor mode. This mode puts the buffer in read-only state
;; and sets up a special key and mouse map to invoke communication with
;; the current sdcdb process. The minor mode may be toggled on/off as needed.
;; (ESC-T) 

;; C-expressions may be evaluated by sdcdbsrc by simply pointing at text in the
;; current source buffer with the mouse or by centering the cursor over text
;; and typing a single key command. ('p' for print, '*' for print *).

;; As code is debugged and new buffers are displayed, the focus of sdcdbsrc
;; follows to each new source buffer. Makes debugging fun. (sound like a
;; commercial or what!)
;; 

;; Current Listing ::
;;key		binding					Comment
;;---		-------					-------
;;
;; r               sdcdb-return-from-src	SDCDB return command
;; n               sdcdb-next-from-src	SDCDB next command
;; b               sdcdb-back-from-src	SDCDB back command
;; w               sdcdb-where-from-src	SDCDB where command
;; f               sdcdb-finish-from-src	SDCDB finish command
;; u               sdcdb-up-from-src      SDCDB up command
;; d               sdcdb-down-from-src	SDCDB down command
;; c               sdcdb-cont-from-src	SDCDB continue command
;; i               sdcdb-stepi-from-src	SDCDB step instruction command
;; s               sdcdb-step-from-src	SDCDB step command
;; ?               sdcdb-whatis-c-sexp	SDCDB whatis command for data at
;;					     buffer point
;; x               sdcdbsrc-delete        SDCDB Delete all breakpoints if no arg
;;					     given or delete arg (C-u arg x)
;; m               sdcdbsrc-frame         SDCDB Display current frame if no arg,
;;					     given or display frame arg
;; *               sdcdb-*print-c-sexp	SDCDB print * command for data at
;;					       buffer point
;; !               sdcdbsrc-goto-sdcdb		Goto the SDCDB output buffer
;; p               sdcdb-print-c-sexp	SDCDB print * command for data at
;;					     buffer point
;; g               sdcdbsrc-goto-sdcdb		Goto the SDCDB output buffer
;; t               sdcdbsrc-mode		Toggles Sdcdbsrc mode (turns it off)
;; 
;; C-c C-f         sdcdb-finish-from-src	SDCDB finish command
;; 
;; C-x SPC         sdcdb-break		Set break for line with point
;; ESC t           sdcdbsrc-mode		Toggle Sdcdbsrc mode
;; ESC m           sdcdbsrc-srcmode             Toggle list mode
;;
;; Local Bindings for buffer when you exit Sdcdbsrc minor mode
;;
;; C-x SPC         sdcdb-break		Set break for line with point
;; ESC t           sdcdbsrc-mode		Toggle Sdcdbsrc mode
;;

;;; (eval-when-compile
;;;   (or noninteractive
;;;       (progn 
;;;         (message "ONLY compile sdcdbsrc except with -batch because of advice")
;;;         (ding)
;;;       )))
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
;;
;; default values should be changed as needed
;;
(defvar sdcdbsrc-cpu-type "51")
(defvar sdcdbsrc-frequency "11059200")
(defvar sdcdbsrc-serial   nil)

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
	   "-cpu"
	   sdcdbsrc-cpu-type
	   "-X"
	   sdcdbsrc-frequency
	   "-fullname"	  	  	 
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

(require 'sdcdb "sdcdb")			; NOT gud!  (yet...)

(defvar sdcdbsrc-active-p t
  "*Set to nil if you do not want source files put in sdcdbsrc-mode")

(defvar sdcdbsrc-call-p nil
  "True if sdcdb command issued from a source buffer")

(defvar sdcdbsrc-associated-buffer nil
  "Buffer name of attached sdcdb process")

(defvar sdcdbsrc-mode nil
  "Indicates whether buffer is in sdcdbsrc-mode or not")
(make-variable-buffer-local 'sdcdbsrc-mode)

(defvar sdcdbsrc-global-mode nil
  "Indicates whether global sdcdbsrc bindings are in effect or not")

(defvar sdcdb-prompt-pattern "^[^)#$%>\n]*[)#$%>] *"
  "A regexp for matching the end of the sdcdb prompt")

(defvar eos::toolbar-toggle-srcmode
  
  (toolbar-make-button-list
   (expand-file-name "recycle.xbm" eos::toolbar-icon-directory))
  "A Run icon pair.")
;;; bindings

(defvar sdcdbsrc-global-map
  (let ((map (make-sparse-keymap)))
    (set-keymap-name map 'sdcdbsrc-global-map)
    (define-key map "\C-x " 'sdcdb-break)
    (define-key map "\M-\C-t" 'sdcdbsrc-mode)
    (define-key map "\M-\C-g" 'sdcdbsrc-goto-sdcdb)
    (define-key map "\M-m"    'sdcdbsrc-srcmode)
    ;; middle button to select and print expressions...
    (define-key map '(meta button2)       'sdcdbsrc-print-csexp)
    (define-key map '(meta shift button2) 'sdcdbsrc-*print-csexp)
    ;; left button to position breakpoints
    (define-key map '(meta button1)       'sdcdbsrc-set-break)
    (define-key map '(meta shift button1) 'sdcdbsrc-set-tbreak-continue)
    map)
  "Global minor keymap that is active whenever sdcdbsrc is running.")

(add-minor-mode 'sdcdbsrc-global-mode " SdcdbGlobal" sdcdbsrc-global-map)

(defvar sdcdbsrc-mode-map
  (let ((map (make-sparse-keymap)))
    (suppress-keymap map)
    (set-keymap-name map 'sdcdbsrc-mode-map)
    ;; inherit keys from global sdcdbsrc map just in case that somehow gets turned off.
    (set-keymap-parents map (list sdcdbsrc-global-map))
    (define-key map "\C-x\C-q" 'sdcdbsrc-mode) ; toggle read-only
    (define-key map "\C-c\C-c" 'sdcdbsrc-mode)
    (define-key map "b" 'sdcdb-break)
    (define-key map "g" 'sdcdbsrc-goto-sdcdb)
    (define-key map "!" 'sdcdbsrc-goto-sdcdb)
    (define-key map "p" 'sdcdb-print-c-sexp)
    (define-key map "*" 'sdcdb-*print-c-sexp)
    (define-key map "?" 'sdcdb-whatis-c-sexp)
    (define-key map "R" 'sdcdbsrc-reset)
    map)
  "Minor keymap for buffers in sdcdbsrc-mode")

(add-minor-mode 'sdcdbsrc-mode " SdcdbSrc" sdcdbsrc-mode-map)

(defvar sdcdbsrc-toolbar
  '([eos::toolbar-stop-at-icon
     sdcdb-break
     t
     "Stop at selected position"]
    [eos::toolbar-stop-in-icon
     sdcdb-break
     t
     "Stop in function whose name is selected"]
    [eos::toolbar-clear-at-icon
     sdcdb-clear
     t
     "Clear at selected position"]
    [eos::toolbar-evaluate-icon
     sdcdb-print-c-sexp
     t
     "Evaluate selected expression; shows in separate XEmacs frame"]    
    [eos::toolbar-run-icon
     sdcdbsrc-run
     t
     "Run current program"]
    [eos::toolbar-cont-icon
     sdcdbsrc-cont
     t
     "Continue current program"]
    [eos::toolbar-step-into-icon
     sdcdbsrc-step
     t
     "Step into (aka step)"]
    [eos::toolbar-step-over-icon
     sdcdbsrc-next
     t
     "Step over (aka next)"]       
    [eos::toolbar-fix-icon
     nil
     nil
     "Fix (not available with sdcdb)"]    
    [eos::toolbar-build-icon
     toolbar-compile
     t
     "Build (aka make -NYI)"]
    [eos::toolbar-toggle-srcmode
     sdcdbsrc-srcmode
     t
     "Toggle Source C <-> Asm"]
    ))

(defmacro def-sdcdb-from-src (sdcdb-command key &optional doc &rest forms)
  "Create a function that will call SDCDB-COMMAND with KEY."
  (let* ((fname (format "sdcdbsrc-%s" sdcdb-command))
	 (cstr (list 'if 'arg
		     (list 'format "%s %s" sdcdb-command '(prefix-numeric-value arg))
		     sdcdb-command))
	 fun)
    (while (string-match " " fname)
      (aset fname (match-beginning 0) ?-))
    (setq fun (intern fname))
    
     (list 'progn
	   (nconc (list 'defun fun '(arg)
			(or doc "")
			'(interactive "P")
			(list 'sdcdb-call-from-src cstr))
		  forms)
	   (list 'define-key 'sdcdbsrc-mode-map key  (list 'quote fun)))))

(def-sdcdb-from-src "step"   "s" "Step one instruction in src"
  (sdcdb-delete-arrow-extent))
(def-sdcdb-from-src "stepi"  "i" "Step one source line (skip functions)"
  (sdcdb-delete-arrow-extent))
(def-sdcdb-from-src "cont"   "c" "Continue with display"
  (sdcdb-delete-arrow-extent))
(def-sdcdb-from-src "down"   "d" "Go down N stack frames (numeric arg) ")
(def-sdcdb-from-src "up"     "u" "Go up N stack frames (numeric arg)")
(def-sdcdb-from-src "finish" "f" "Finish frame")
(def-sdcdb-from-src "where"  "w" "Display (N frames of) backtrace")
(def-sdcdb-from-src "next"   "n" "Step one line with display"
  (sdcdb-delete-arrow-extent))
(def-sdcdb-from-src "run"    "r" "Run program from start"
  (sdcdb-delete-arrow-extent))
(def-sdcdb-from-src "return" "R" "Return from selected stack frame")
(def-sdcdb-from-src "disable" "x" "Disable all breakpoints")
(def-sdcdb-from-src "delete" "X" "Delete all breakpoints")
(def-sdcdb-from-src "quit"   "Q" "Quit sdcdb."
  (sdcdb-delete-arrow-extent))
(def-sdcdb-from-src "info locals" "l" "Show local variables")
(def-sdcdb-from-src "info break"  "B" "Show breakpoints")
(def-sdcdb-from-src ""  "\r" "Repeat last command")
(def-sdcdb-from-src "frame"  "m" "Show frame if no arg, with arg go to frame")

;;; code

;;;###autoload
(defun sdcdbsrc (path &optional core-or-pid)
  "Activates a sdcdb session with sdcdbsrc-mode turned on.  A numeric prefix
argument can be used to specify a running process to attach, and a non-numeric
prefix argument will cause you to be prompted for a core file to debug."
  (interactive (let ((file (read-file-name "Program to debug: " nil nil t)))
		 (cond ((numberp current-prefix-arg)
			(list file (int-to-string current-prefix-arg)))
		       (current-prefix-arg
			(list file (read-file-name "Core file: " nil nil t)))
		       (t (list file)))
		 ))
  ;; FIXME - this is perhaps an uncool thing to do --Stig
  (delete-other-windows)
  (split-window-vertically)
  (other-window 0)

  (sdcdb path core-or-pid)
  (local-set-key 'button2 'sdcdbsrc-select-or-yank)
  (setq mode-motion-hook 'sdcdbsrc-mode-motion)
  ;; XEmacs change:
  (make-local-hook 'kill-buffer-hook)
  (add-hook 'kill-buffer-hook 'sdcdbsrc-reset nil t))

(defun sdcdbsrc-global-mode ()
  ;; this can be used as a hook for sdcdb-mode....
  (or current-sdcdb-buffer
      (and (eq major-mode 'sdcdb-mode)	; doesn't work w/ energize yet
	   (setq current-sdcdb-buffer (current-buffer))
	   ;; XEmacs change:
	   (progn
	     (make-local-hook 'kill-buffer-hook)
	     (add-hook 'kill-buffer-hook 'sdcdbsrc-reset nil t)))
      (error "Cannot determine current-sdcdb-buffer"))
;;;   (set-process-filter 
;;;    (get-buffer-process current-sdcdb-buffer) 'sdcdbsrc-mode-filter)
;;;   (set-process-sentinel 
;;;    (get-buffer-process current-sdcdb-buffer) 'sdcdbsrc-mode-sentinel)
  ;; sdcdbsrc-global-mode was set to t here but that tended to piss
  ;; people off
  (setq sdcdbsrc-global-mode nil
	sdcdbsrc-active-p	   t
	sdcdbsrc-call-p	   nil
	sdcdbsrc-mode	   nil)
  (message "Gbd source mode active"))
 
(add-hook 'sdcdb-mode-hook 'sdcdbsrc-global-mode)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Sdcdb Source minor mode.
;;; 

(defvar sdcdbsrc-associated-buffer nil
  "The sdcdb buffer to send commands to.")
(defvar sdcdbsrc-initial-readonly  'undefined
  "read-only status of buffer when not in sdcdbsrc-mode")
(defvar sdcdbsrc-old-toolbar nil
  "saved toolbar for buffer")

(defun sdcdbsrc-mode (arg &optional quiet)
  "Minor mode for interacting with sdcdb from a c source file.
With arg, turn sdcdbsrc-mode on iff arg is positive.  In sdcdbsrc-mode,
you may send an associated sdcdb buffer commands from the current buffer
containing c source code."
  (interactive "P")
  (setq sdcdbsrc-mode
	(if (null arg)
	    (not sdcdbsrc-mode)
	  (> (prefix-numeric-value arg) 0)))

  (cond (sdcdbsrc-mode
	 (cond ((not (local-variable-p 'sdcdbsrc-initial-readonly (current-buffer)))
		(set (make-local-variable 'sdcdbsrc-initial-readonly)
		     buffer-read-only)
		(set (make-local-variable 'sdcdbsrc-associated-buffer)
		     current-sdcdb-buffer)
		(if (featurep 'toolbar)
		    (set (make-local-variable 'sdcdbsrc-old-toolbar)
			 (specifier-specs default-toolbar (current-buffer))))
		)
	       )
	 (if (featurep 'toolbar)
	     (set-specifier default-toolbar (cons (current-buffer)
						  sdcdbsrc-toolbar)))
	 (setq buffer-read-only t)
	 (or quiet (message "Entering sdcdbsrc-mode...")))
	(t
	 (and (local-variable-p 'sdcdbsrc-initial-readonly (current-buffer))
	      (progn
		(if (featurep 'toolbar)
		    (if sdcdbsrc-old-toolbar
			(set-specifier default-toolbar
				       (cons (current-buffer)
					     sdcdbsrc-old-toolbar))
		      (remove-specifier default-toolbar (current-buffer))))
		(kill-local-variable 'sdcdbsrc-old-toolbar)
		(setq buffer-read-only sdcdbsrc-initial-readonly)
		(kill-local-variable 'sdcdbsrc-initial-readonly)
		(kill-local-variable 'sdcdbsrc-associated-buffer)
		))
	 (or quiet (message "Exiting sdcdbsrc-mode..."))))
  (redraw-modeline t))

;;
;; Sends commands to sdcdb process.

(defun sdcdb-call-from-src (command)
  "Send associated sdcdb process COMMAND displaying source in this window."
  (setq sdcdbsrc-call-p t)
    (let ((src-win (selected-window))
	  (buf (or sdcdbsrc-associated-buffer current-sdcdb-buffer)))
      (or (buffer-name buf)
	  (error "SDCDB buffer deleted"))
      (pop-to-buffer buf)
      (goto-char (point-max))
      (beginning-of-line)
      ;; Go past sdcdb prompt 
      (re-search-forward
       sdcdb-prompt-pattern (save-excursion (end-of-line) (point))  t)
      ;; Delete any not-supposed-to-be-there text
      (delete-region (point) (point-max)) 
      (insert command)
      (comint-send-input)
      (select-window src-win)
      ))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;
;;; Define Commands for SDCDB SRC Mode Buffer
;;;

;;; ;; #### - move elsewhere
(or (fboundp 'event-buffer)
    (defun event-buffer (event)
      "Return buffer assocaited with EVENT, or nil."
      (let ((win (event-window event)))
	(and win (window-buffer win)))))

(defun set-sdcdbsrc-mode-motion-extent (st en action)
  ;; by Stig@hackvan.com
  (let ((ex  (make-extent st en)))
    (set-extent-face ex 'highlight)
    (set-extent-property ex 'sdcdbsrc t)
    (set-extent-property ex 'action action)
    (setq mode-motion-extent ex)))

(defun nuke-mode-motion-extent ()
  ;; by Stig@hackvan.com
  (cond (mode-motion-extent
	 (delete-extent mode-motion-extent)
	 (setq mode-motion-extent nil))))

(defun looking-at-any (regex-list)
  ;; by Stig@hackvan.com
  (catch 'found
    (while regex-list
      (and (looking-at (car regex-list))
	   (throw 'found t))
      (setq regex-list (cdr regex-list)))))

(defconst sdcdb-breakpoint-patterns
  '(
    ;; when execution stops...
    ;;Breakpoint 1, XlwMenuRedisplay (w=0x4d2e00, ev=0xefffe3f8, region=0x580e60)
    ;;    at /net/stig/src/xemacs/lwlib/xlwmenu.c:2518
    "^[BW][ra][et][ac][kh]point [0-9]+, .*\\(\n\\s .*\\)*"
    ;; output of the breakpoint command:
    ;;Breakpoint 1 at 0x19f5c8: file /net/stig/src/xemacs/lwlib/xlwmenu.c, line 2715.
    "^[BW][ra][et][ac][kh]point [0-9]+ at .*: file \\([^ ,\n]+\\), line \\([0-9]+\\)."
    ;;Num Type           Disp Enb Address    What
    ;;1   breakpoint     keep y   0x0019ee60 in XlwMenuRedisplay
    ;;                                       at /net/stig/src/xemacs/lwlib/xlwmenu.c:2518
    "^[0-9]+\\s +[bw][ra][et][ac][kh]point.* in .*\\(\n\\s +\\)?at [^ :\n]+:[0-9]+\\(\n\\s .*\\)*"
    )
  "list of patterns to match sdcdb's various ways of displaying a breakpoint")

(defun sdcdbsrc-make-breakpoint-action (string)
  ;; by Stig@hackvan.com
  (if (or (string-match "file \\([^ ,\n]+\\), line \\([0-9]+\\)" string)
	  (string-match "at \\([^ :\n]+\\):\\([0-9]+\\)" string))
      (list 'sdcdbsrc-display
	    (match-string 1 string)
	    (string-to-int (match-string 2 string)))))

(defconst sdcdb-stack-frame-pattern
  ;;#9  0x62f08 in emacs_Xt_next_event (emacs_event=0x4cf804)
  ;;    at /net/stig/src/xemacs/src/event-Xt.c:1778
  "^#\\([0-9]+\\)\\s +\\(0x[0-9a-f]+ in .*\\|.*\\sw+.* (.*) at .*\\)\\(\n\\s .*\\)*"
  "matches the first line of a sdcdb stack frame and all continuation lines.
subex 1 is frame number.")

(defun sdcdbsrc-mode-motion (ee)
  ;; by Stig@hackvan.com
  (save-excursion
    (set-buffer (event-buffer ee))
    (save-excursion
      (if (not (event-point ee))
	  (nuke-mode-motion-extent)
	(goto-char (event-point ee))
	(beginning-of-line)
	(while (and (not (bobp)) (eq ?  (char-syntax (following-char))))
	  (forward-line -1))
	(if (extent-at (point) (current-buffer) 'sdcdbsrc)
	    nil
	  (nuke-mode-motion-extent)
	  (cond ((looking-at-any sdcdb-breakpoint-patterns)
		 (set-sdcdbsrc-mode-motion-extent
		  (match-beginning 0)
		  (match-end 0)
		  (sdcdbsrc-make-breakpoint-action (match-string 0))))
		((looking-at sdcdb-stack-frame-pattern)
		 (set-sdcdbsrc-mode-motion-extent
		  (match-beginning 0)
		  (match-end 0)
		  (list 'sdcdbsrc-frame
			(string-to-int (match-string 1)))))
		)))
      )))
  
(defun sdcdbsrc-display (file line)
  ;; by Stig@hackvan.com
  (select-window (display-buffer (find-file-noselect file)))
  (goto-line line))

(defun click-inside-selection-p (click)
  (or (click-inside-extent-p click primary-selection-extent)
      (click-inside-extent-p click zmacs-region-extent)
      ))

(defun click-inside-extent-p (click extent)
  "Returns non-nil if the button event is within the bounds of the primary
selection-extent, nil otherwise."
  ;; stig@hackvan.com
  (let ((ewin (event-window click))
	(epnt (event-point click)))
    (and ewin
	 epnt
	 extent
	 (eq (window-buffer ewin)
	     (extent-object extent))
	 (extent-start-position extent)
	 (> epnt (extent-start-position extent))
	 (> (extent-end-position extent) epnt))))

(defun point-inside-extent-p (extent)
  "Returns non-nil if the point is within or just after the bounds of the
primary selection-extent, nil otherwise."
  ;; stig@hackvan.com
  (and extent		; FIXME - I'm such a sinner...
       (eq (current-buffer) 
	   (extent-object extent))
       (> (point) (extent-start-position extent))
       (>= (extent-end-position extent) (point))))

(defun sdcdbsrc-select-or-yank (ee)
  ;; by Stig@hackvan.com
  (interactive "e")
  (let ((action (save-excursion
		  (set-buffer (event-buffer ee))
		  (and mode-motion-extent
		       (click-inside-extent-p ee mode-motion-extent)
		       (extent-property mode-motion-extent 'action)))
		))
    (if action
	(eval action)
      (mouse-yank ee))))

(defvar sdcdb-print-format ""
  "Set this variable to a valid format string to print c-sexps in a
different way (hex,octal, etc).")

(defun sdcdb-print-c-sexp ()
  "Find the nearest c-mode sexp. Send it to sdcdb with print command."
  (interactive)
  (let* ((tag (find-c-sexp))
	 (command (concat "print " sdcdb-print-format tag)))
    (sdcdb-call-from-src command)))

(defun sdcdbsrc-srcmode ()
  "Toggle between assembler & C source modes."
  (sdcdb-call-from-src "set srcmode"))

(defun sdcdb-*print-c-sexp ()
  "Find the nearest c-mode sexp. Send it to sdcdb with the print * command."
  (interactive)
  (let* ((tag (find-c-sexp))
	(command (concat "print " sdcdb-print-format "*"  tag)))
    (sdcdb-call-from-src  command)))
 
(defun sdcdb-whatis-c-sexp ()
  "Find the nearest c-mode sexp. Send it to sdcdb with the whatis command. "
  (interactive)
  (let* ((tag (sdcdbsrc-selection-or-sexp))
	 (command (concat "ptype " tag)))
    (sdcdb-call-from-src command)))

(defun sdcdbsrc-goto-sdcdb ()
  "Hop back and forth between the sdcdb interaction buffer and the sdcdb source
buffer.  "
  ;; by Stig@hackvan.com
  (interactive)
  (let ((gbuf (or sdcdbsrc-associated-buffer current-sdcdb-buffer)))
    (cond ((eq (current-buffer) gbuf)
	   (and sdcdb-arrow-extent
		(extent-object sdcdb-arrow-extent)
		(progn (pop-to-buffer (extent-object sdcdb-arrow-extent))
		       (goto-char (extent-start-position sdcdb-arrow-extent)))))
	  ((buffer-name gbuf) (pop-to-buffer gbuf))
	  ((y-or-n-p "No debugger.  Start a new one? ")
	         (call-interactively 'sdcdbsrc))
	  (t (error "No sdcdb buffer."))
	  )))

(defvar sdcdbsrc-last-src-buffer nil)

(defun sdcdbsrc-goto-src ()
  (interactive)
  (let* ((valid (and sdcdbsrc-last-src-buffer
		     (memq sdcdbsrc-last-src-buffer (buffer-list))))
	 (win (and valid
		   (get-buffer-window sdcdbsrc-last-src-buffer))))
    (cond (win (select-window win))
	  (valid (pop-to-buffer sdcdbsrc-last-src-buffer)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;
;;;  The following functions are used to extract the closest surrounding
;;;  c expression from point
;;;
(defun back-sexp ()
  "Version of backward-sexp that catches errors"
  (condition-case nil
      (backward-sexp)
    (error t)))

(defun forw-sexp ()
  "Version of forward-sexp that catches errors"
  (condition-case nil
     (forward-sexp)
    (error t)))

(defun sexp-compound-sep (span-start span-end)
  "Returns '.' for '->' & '.', returns ' ' for white space,
returns '?' for other puctuation"  
  (let ((result ? )
	(syntax))
    (while (< span-start span-end)
      (setq syntax (char-syntax (char-after span-start)))
      (cond
       ((= syntax ? ) t)
       ((= syntax ?.) (setq syntax (char-after span-start))
	(cond 
	 ((= syntax ?.) (setq result ?.))
	 ((and (= syntax ?-) (= (char-after (+ span-start 1)) ?>))
	  (setq result ?.)
	  (setq span-start (+ span-start 1)))
	 (t (setq span-start span-end)
	    (setq result ??)))))
      (setq span-start (+ span-start 1)))
    result 
    )
  )

(defun sexp-compound (first second)
  "Returns non-nil if the concatenation of two S-EXPs result in a Single C 
token. The two S-EXPs are represented as a cons cells, where the car 
specifies the point in the current buffer that marks the begging of the 
S-EXP and the cdr specifies the character after the end of the S-EXP
Link S-Exps of the form:
      Sexp -> SexpC
      Sexp . Sexp
      Sexp (Sexp)        Maybe exclude if first Sexp is: if, while, do, for, switch
      Sexp [Sexp]
      (Sexp) Sexp
      [Sexp] Sexp"
  (let ((span-start (cdr first))
	(span-end (car second))
	(syntax))
    (setq syntax (sexp-compound-sep span-start span-end))
    (cond
     ((= (car first) (car second)) nil)
     ((= (cdr first) (cdr second)) nil)
     ((= syntax ?.) t)
     ((= syntax ? )
	 (setq span-start (char-after (- span-start 1)))
	 (setq span-end (char-after span-end))
	 (cond
	  ((= span-start ?) ) t )
	  ((= span-start ?] ) t )
          ((= span-end ?( ) t )
	  ((= span-end ?[ ) t )
	  (t nil))
	 )
     (t nil))
    )
  )

(defun sexp-cur ()
  "Returns the  S-EXP that Point is a member, Point is set to begging of S-EXP.
The S-EXPs is represented as a cons cell, where the car specifies the point in
the current buffer that marks the begging of the S-EXP and the cdr specifies 
the character after the end of the S-EXP"
  (let ((p (point)) (begin) (end))
    (back-sexp)
    (setq begin (point))
    (forw-sexp)
    (setq end (point))
    (if (>= p end) 
	(progn
	 (setq begin p)
	 (goto-char p)
	 (forw-sexp)
	 (setq end (point))
	 )
      )
    (goto-char begin)
    (cons begin end)
    )
  )

(defun sexp-prev ()
  "Returns the previous S-EXP, Point is set to begging of that S-EXP.
The S-EXPs is represented as a cons cell, where the car specifies the point in
the current buffer that marks the begging of the S-EXP and the cdr specifies 
the character after the end of the S-EXP"
  (let ((begin) (end))
    (back-sexp)
    (setq begin (point))
    (forw-sexp)
    (setq end (point))
    (goto-char begin)
    (cons begin end))
)

(defun sexp-next ()
  "Returns the following S-EXP, Point is set to begging of that S-EXP.
The S-EXPs is represented as a cons cell, where the car specifies the point in
the current buffer that marks the begging of the S-EXP and the cdr specifies 
the character after the end of the S-EXP"
  (let ((begin) (end))
    (forw-sexp)
    (forw-sexp)
    (setq end (point))
    (back-sexp)
    (setq begin (point))
    (cons begin end)
    )
  )

(defun find-c-sexp ()
  "Returns the Complex  S-EXP that surrounds Point"
  (interactive)
  (save-excursion
    (let ((p) (sexp) (test-sexp))
      (setq p (point))
      (setq sexp (sexp-cur))
      (setq test-sexp (sexp-prev))
      (while (sexp-compound test-sexp sexp)
	(setq sexp (cons (car test-sexp) (cdr sexp)))
	(goto-char (car sexp))
	(setq test-sexp (sexp-prev))
	)
      (goto-char p)
      (setq test-sexp (sexp-next))
      (while (sexp-compound sexp test-sexp)
	(setq sexp (cons (car sexp) (cdr test-sexp)))
	(setq test-sexp (sexp-next))
	)
      (buffer-substring (car sexp) (cdr sexp))
      )
    )
  )

(defun sdcdbsrc-selection-or-sexp (&optional ee)
  ;; FIXME - fix this docstring
  "If the EVENT is within the primary selection, then return the selected
text, otherwise parse the expression at the point of the mouse click and
return that.  If EVENT is nil, then return the C sexp at point."
  ;; stig@hackvan.com
  (cond ((or (and ee (click-inside-selection-p ee))
	     (and (not ee) (point-inside-selection-p)))
	 (replace-in-string (extent-string primary-selection-extent) "\n\\s *" " "))
	(ee 
	 (sdcdbsrc-get-csexp-at-click ee))
	(t
	 (find-c-sexp))
	))

(defun sdcdbsrc-get-csexp-at-click (ee) 
  "Returns the containing s-expression located at the mouse cursor to point."
  ;; "
  ;; by Stig@hackvan.com
  (let ((ewin (event-window ee))
	(epnt (event-point ee)))
    (or (and ewin epnt)
	(error "Must click within a window"))
    (save-excursion
      (set-buffer (window-buffer ewin))
      (save-excursion
	(goto-char epnt)
	(find-c-sexp)))))

(defun sdcdbsrc-print-csexp (&optional ee)
  (interactive) 
  (or ee (setq ee current-mouse-event))
  (sdcdb-call-from-src
	 (concat "print "  sdcdb-print-format (sdcdbsrc-selection-or-sexp ee))))

(defun sdcdbsrc-*print-csexp (&optional ee)
  (interactive) 
  (or ee (setq ee current-mouse-event))
  (sdcdb-call-from-src
   (concat "print *"  sdcdb-print-format (sdcdbsrc-selection-or-sexp ee))))

;; (defun sdcdbsrc-print-region (arg)
;;   (let (( command  (concat "print " sdcdb-print-format (x-get-cut-buffer))))
;;     (sdcdb-call-from-src command)))
;; 
;; (defun sdcdbsrc-*print-region (arg)
;;   (let (( command  (concat "print *" sdcdb-print-format (x-get-cut-buffer))))
;;     (sdcdb-call-from-src command)))

(defun sdcdbsrc-file:lno ()
  "returns \"file:lno\" specification for location of point. "
  ;; by Stig@hackvan.com
  (format "%s:%d"
	  (file-name-nondirectory buffer-file-name)
	  (save-restriction
	    (widen)
	    (1+ (count-lines (point-min)
			     (save-excursion (beginning-of-line) (point)))))
	  ))

(defun sdcdbsrc-set-break (ee)
  "Sets a breakpoint.  Click on the selection and it will set a breakpoint
using the selected text.  Click anywhere in a source file, and it will set
a breakpoint at that line number of that file."
  ;; by Stig@hackvan.com
  ;; there is already sdcdb-break, so this only needs to work with mouse clicks.
  (interactive "e") 
  (sdcdb-call-from-src
   (concat "break "
	   (if (click-inside-selection-p ee)
	       (extent-string primary-selection-extent)
	     (mouse-set-point ee)
	     (or buffer-file-name (error "No file in window"))
	     (- (sdcdbsrc-file:lno) 1)
	     ))))

(defun sdcdbsrc-set-tbreak-continue (&optional ee)
  "Set a temporary breakpoint at the position of the mouse click and then
continues.  This can be bound to either a key or a mouse button."
  ;; by Stig@hackvan.com
  (interactive)
  (or ee (setq ee current-mouse-event))
  (and ee (mouse-set-point ee))
  (sdcdb-call-from-src (concat "tbreak " (sdcdbsrc-file:lno)))
  (sdcdb-call-from-src "c"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Functions extended from sdcdb.el for sdcdbsrc.
;;
;; sdcdbsrc-set-buffer - added a check to set buffer to sdcdbsrc-associated-buffer
;;                  to handle multiple sdcdb sessions being driven from src
;;                  files.

(require 'advice)

(defadvice sdcdb-set-buffer (after sdcdbsrc activate) ; ()
  "Advised to work from a source buffer instead of just the sdcdb buffer."
  ;; by Stig@hackvan.com
  ;; the operations below have tests which are disjoint from the tests in
  ;; the original `sdcdb-set-buffer'.  Current-sdcdb-buffer cannot be set twice.
  (and sdcdbsrc-call-p
       sdcdbsrc-associated-buffer
       (setq current-sdcdb-buffer sdcdbsrc-associated-buffer)))

(defadvice sdcdb-display-line (around sdcdbsrc activate)
  ;; (true-file line &optional select-method)
  "Advised to select the source buffer instead of the sdcdb-buffer"
  ;; by Stig@hackvan.com
  (ad-set-arg 2 'source) ; tell it not to select the sdcdb window
  ad-do-it
  (save-excursion
    (let* ((buf (extent-object sdcdb-arrow-extent))
	   (win (get-buffer-window buf)))
      (setq sdcdbsrc-last-src-buffer buf)
      (select-window win)
      (set-window-point win (extent-start-position sdcdb-arrow-extent))
      (set-buffer buf))
    (and sdcdbsrc-active-p
	 (not sdcdbsrc-mode)
	 (not (eq (current-buffer) current-sdcdb-buffer))
	 (sdcdbsrc-mode 1))))

(defadvice sdcdb-filter (after sdcdbsrc activate) ; (proc string)
  ;; by Stig@hackvan.com
  ;; if we got a sdcdb prompt and it wasn't a sdcdbsrc command, then it's sdcdb
  ;; hitting a breakpoint or having a core dump, so bounce back to the sdcdb
  ;; window.
  (let* ((selbuf (window-buffer (selected-window)))
	 win)
    ;; if we're at a sdcdb prompt, then display the buffer
    (and (save-match-data (string-match sdcdb-prompt-pattern (ad-get-arg 1)))
	 (prog1
	     (not sdcdbsrc-call-p)
	   (setq sdcdbsrc-call-p nil))
	 (setq win (display-buffer current-sdcdb-buffer))
	 ;; if we're not in either the source buffer or the sdcdb buffer,
	 ;; then select the window too...
	 (not (eq selbuf current-sdcdb-buffer))
	 (not (eq selbuf sdcdbsrc-last-src-buffer))
	 (progn
	   (ding nil 'warp)
	   (select-window win)))
    ))

(defun sdcdbsrc-reset ()
  ;; tidy house and turn off sdcdbsrc-mode in all buffers
  ;; by Stig@hackvan.com
  (sdcdb-delete-arrow-extent)
  (setq sdcdbsrc-global-mode nil)
  (mapcar #'(lambda (buffer) 
	      (set-buffer buffer)
	      (cond ((eq sdcdbsrc-associated-buffer current-sdcdb-buffer)
		     (sdcdbsrc-mode -1))))
	  (buffer-list)))

(defadvice sdcdb-sentinel (after sdcdbsrc freeze) ; (proc msg)
  ;; by Stig@hackvan.com
  (sdcdbsrc-reset)
  (message "Sdcdbsrc finished"))

(provide 'sdcdbsrc)
