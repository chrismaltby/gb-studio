import sys, re
import string

"""Simple script that scans all of the test suite results text fed in
through stdin and summarises the total number of failures, test
points, and test cases."""

# Read in everything
lines = sys.stdin.readlines()

# Init the running totals
failures = 0
cases = 0
tests = 0

for line in lines:
    # '--- Summary: f/t/c ...', where f = # failures, t = # test points,
    # c = # test cases.
    if (re.search(r'^--- Summary:', line)):
        (summary, data, rest) = re.split(r':', line)
        (nfailures, ntests, ncases) = re.split(r'/', data)
        failures = failures + string.atof(nfailures)
        tests = tests + string.atof(ntests)
        cases = cases + string.atof(ncases)

print "%.0f failures, %.0f tests, %.0f test cases" % (failures, tests, cases)
