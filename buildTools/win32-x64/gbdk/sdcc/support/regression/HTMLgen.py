#'$Id: HTMLgen.py,v 1.1 2001/05/06 16:01:19 michaelh Exp $'

# COPYRIGHT (C) 1996-9  ROBIN FRIEDRICH  email:Robin.Friedrich@pdq.net
# Permission to use, copy, modify, and distribute this software and
# its documentation for any purpose and without fee is hereby granted,
# provided that the above copyright notice appear in all copies and
# that both that copyright notice and this permission notice appear in
# supporting documentation.
# THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS
# SOFTWARE, INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
# FITNESS, IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
# SPECIAL, INDIRECT OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER
# RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF
# CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
# CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

# Stripped down by Michael Hope <michaelh@juju.net.nz> to just support
# template documents.

"""A class library for the generation of HTML documents.

Each HTML tag type has a supporting class which is responsible for
emitting itself as valid HTML formatted text. An attempt is made to
provide classes for newer HTML 3.2 and proposed tag elements.  The
definitive reference for HTML tag elements can be found at
[W3C].  Also, I used the HTML book by Musciano and
Kennedy from [O Reilly] (2nd. Ed.) as the guiding reference.

The Document classes are container objects which act as a focal point
to populate all the contents of a particular web page. It also can
enforce consistent document formating according to the guidelines from
the [Yale Web Style Manual].

Features include customization of document template graphics / colors
through use of resource files, minimizing the need for modifying or
subclassing from the module source code. Support for tables, frames,
forms (persistent and otherwise) and client-side imagemaps are included.

A newer implementation for the Table support is now included,
TableLite().  In support of this there are new tag classes TD, TH, TR
and Caption.  These class instances can be assembled in any way to
populate the TableLite container object. 

.. [W3C] http://www.W3.org/TR/REC-html32.html
.. [O Reilly] http://www.oreilly.com/catalog/html3/index.html
.. [Yale Web Style Manual] http://info.med.yale.edu/caim/manual/contents.html
"""

import string, re, time, os

__author__ = 'Robin Friedrich   friedrich@pythonpros.com'
__version__ = '2.2.2'

#################
# CLASS LIBRARY #
#################

class StringTemplate:
    """Generate documents based on a template and a substitution mapping.

    Must use Python 1.5 or newer. Uses re and the get method on dictionaries.

    Usage:
       T = TemplateDocument('Xfile')
       T.substitutions = {'month': ObjectY, 'town': 'Scarborough'}
       T.write('Maine.html')

    A dictionary, or object that behaves like a dictionary, is assigned to the
    *substitutions* attribute which has symbols as keys to objects. Upon every
    occurance of these symbols surrounded by braces {} in the source template,
    the corresponding value is converted to a string and substituted in the output.

    For example, source text which looks like:
     I lost my heart at {town} Fair.
    becomes:
     I lost my heart at Scarborough Fair.

    Symbols in braces which do not correspond to a key in the dictionary remain
    unchanged.

    An optional third argument to the class is a list or two strings to be
    used as the delimiters instead of { } braces. They must be of the same
    length; for example ['##+', '##'] is invalid.
    """
    def __init__(self, template, substitutions=None, **kw):
        self.delimiters = ['{', '}']
        self.__dict__.update(kw)
        if len(self.delimiters) != 2:
            raise ValueError("delimiter argument must be a pair of strings")
        self.delimiter_width = len(self.delimiters[0])
        delimiters = map(re.escape, self.delimiters)
        self.subpatstr = delimiters[0] + "[\w_]+" + delimiters[1]
        self.subpat = re.compile(self.subpatstr)
        self.substitutions = substitutions or {}
        self.set_template(template)

    def set_template(self, template):
        self.source = template
    
    def keys(self):
        return self.substitutions.keys()

    def __setitem__(self, name, value):
        self.substitutions[name] = value
        
    def __getitem__(self, name):
        return self.substitutions[name]
      
    def __str__(self):
        return self._sub(self.source)

    def _sub(self, source, subs=None):
        """Perform source text substitutions.

        *source* string containing template source text
        *subs* mapping of symbols to replacement values
        """
        substitutions = subs or self.substitutions
        dw = self.delimiter_width
        i = 0
        output = []
        matched = self.subpat.search(source[i:])
        while matched:
            a, b = matched.span()
            output.append(source[i:i+a])
            # using the new get method for dicts in 1.5
            output.append(str(substitutions.get(
                   source[i+a+dw:i+b-dw], source[i+a:i+b])))
            i = i + b
            matched = self.subpat.search(source[i:])
        else:
            output.append(source[i:])
        return string.join(output, '')
    
    def write(self, filename = None):
        """Emit the Document HTML to a file or standard output.
        
        Will not overwrite file is it exists and is textually the same.
        In Unix you can use environment variables in filenames.
        Will print to stdout if no argument given.
        """
        if filename:
            if os.path.exists(filename):
                s = str(self)
                if compare_s2f(s, filename):
                    f = open(filename, 'w')
                    f.write(str(self))
                    f.close()
            else:
                f = open(filename, 'w')
                f.write(str(self))
                f.close()
        else:
            import sys
            sys.stdout.write(str(self))

class TemplateDocument(StringTemplate):
    """Generate documents based on a template and a substitution mapping.

    Must use Python 1.5 or newer. Uses re and the get method on dictionaries.

    Usage:
       T = TemplateDocument('Xfile')
       T.substitutions = {'month': ObjectY, 'town': 'Scarborough'}
       T.write('Maine.html')

    A dictionary, or object that behaves like a dictionary, is assigned to the
    *substitutions* attribute which has symbols as keys to objects. Upon every
    occurance of these symbols surrounded by braces {} in the source template,
    the corresponding value is converted to a string and substituted in the output.

    For example, source text which looks like:
     I lost my heart at {town} Fair.
    becomes:
     I lost my heart at Scarborough Fair.

    Symbols in braces which do not correspond to a key in the dictionary remain
    unchanged.

    An optional third argument to the class is a list or two strings to be
    used as the delimiters instead of { } braces. They must be of the same
    length; for example ['##+', '##'] is invalid.
    """
    def set_template(self, template):
        f = open(template)
        self.source = f.read()
        f.close()
