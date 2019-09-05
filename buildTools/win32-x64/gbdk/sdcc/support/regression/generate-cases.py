from HTMLgen import TemplateDocument
import sys, re, tempfile, os

"""See InstanceGenerator for a description of this file"""

# Globals
# Directory that the generated files should be placed into
outdir = 'gen'

# Start of the test function table definition
testfuntableheader = """
static TESTFUNP _tests[] = {
"""


# End of the test function table definition
testfuntablefooter = """\tNULL
};
"""

# Code to generate the suite function
testfunsuite = """
TESTFUNP *
suite(void)
{
    return _tests;
}

const char *
getSuiteName(void)
{
    return "{testcase}";
}
""" 

# Utility functions
def trim(a):
    """Removes all white space from the start and the end of a string.
    Like java.lang.String.trim"""
    ret = chomp(re.sub(r'^\s+', '', a))
    return ret
    
def chomp(a):
    """Removes all white space from the end of a string.
    Like perl's chomp"""
    return re.sub(r'\s+$', '', a)

def createdir(path):
    """Creates a directory if it doesn't exist"""
    if not os.path.isdir(path):
        os.mkdir(path)

class InstanceGenerator:
    """Test case iteration generator.
    Takes the template given as the first argument, pulls out all the meta
    iteration information, and generates an instance for each combination
    of the names and types.

    See doc/test_suite_spec.tex for more information on the template file
    format."""

    def __init__(self, inname):
        self.inname = inname
        # Initalise the replacements hash.
        # Map of name to values.
        self.replacements = { }
        # Initalise the function list hash.
        self.functions = []
        # Emit the suite wrapper into a temporary file
        self.tmpname = tempfile.mktemp()
        (self.basename, self.ext) = re.split(r'\.', self.inname)
        self.ext = '.' + self.ext

    def permute(self, basepath, keys, trans = {}):
        """Permutes across all of the names.  For each value, recursivly creates
        a mangled form of the name, this value, and all the combinations of
        the remaining values.  At the tail of the recursion when one full
        combination is built, generates an instance of the test case from
        the template."""
        if len(keys) == 0:
            # End of the recursion.
            # Set the runtime substitutions.
            trans['testcase'] = basepath
            # Create the instance from the template
            T = TemplateDocument(self.tmpname)
            T.substitutions = trans
            T.write(basepath + self.ext)
        else:
            # Pull off this key, then recursivly iterate through the rest.
            key = keys[0]
            for part in self.replacements[key]:
                trans[key] = part
                # Turn a empty string into something decent for a filename
                if not part:
                    part = 'none'
                # Remove any bad characters from the filename.
                part = re.sub(r'\s+', r'_', part)
                # The slice operator (keys[1:]) creates a copy of the list missing the
                # first element.
                # Can't use '-' as a seperator due to the mcs51 assembler.
                self.permute(basepath + '_' + key + '_' + part, keys[1:], trans) 

    def writetemplate(self):
        """Given a template file and a temporary name writes out a verbatim copy
        of the source file and adds the suite table and functions."""
        fout = open(self.tmpname, 'w')

        for line in self.lines:
            fout.write(line)

        # Emmit the suite table
        fout.write(testfuntableheader)

        for fun in self.functions:
            # Turn the function definition into a pointer
            fun = re.sub(r'\(\w+\)', '', fun)
            fout.write("\t" + fun + ",\n")

        fout.write(testfuntablefooter)
        fout.write(testfunsuite);
        
        fout.close()

    def readfile(self):
        """Read in all of the input file."""
        fin = open(self.inname)
        self.lines = fin.readlines()
        fin.close()

    def parse(self):
        # Start off in the header.
        inheader = 1;

        # Iterate over the source file and pull out the meta data.
        for line in self.lines:
            line = trim(line)

            # If we are still in the header, see if this is a substitution line
            if inheader:
                # A substitution line has a ':' in it
                if re.search(r':', line) != None:
                    # Split out the name from the values
                    (name, rawvalues) = re.split(r':', line)
                    # Split the values at the commas
                    values = re.split(r',', rawvalues)
                    
                    # Trim the name
                    name = trim(name)
                    # Trim all the values
                    values = map(trim, values)
                    
                    self.replacements[name] = values
                elif re.search(r'\*/', line) != None:
                    # Hit the end of the comments
                    inheader = 0;
                else:
                    # Do nothing.
                    None
            else:
                # Pull out any test function names
                if re.search(r'^test\w+\(\w+\)', line) != None:
                    self.functions.append(line)

    def generate(self):
        """Main function.  Generates all of the instances."""
        self.readfile()
        self.parse()
        self.writetemplate()

        # Create the output directory if it doesn't exist
        createdir(outdir)

        # Generate
        self.permute(os.path.join(outdir, self.basename), self.replacements.keys())

        # Remove the temporary file
        os.remove(self.tmpname)

# Check and parse the command line arguments
if len(sys.argv) < 2:
    # PENDING: How to throw an error?
    print "usage: generate-cases.py template.c"

# Input name is the first arg.

s = InstanceGenerator(sys.argv[1])
s.generate()
