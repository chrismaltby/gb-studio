Summary: Small Device C Compiler
Name: sdcc
Version: 2.2.2
Release: 0.20010225
Copyright: GPL
Group: Applications/Engineering
Source: sdcc-2.2.2.tar.gz
URL: http://sdcc.sourceforge.net/
Packager: Stephen Williams <steve@icarus.com>

BuildRoot: /tmp/sdcc

%description
SDC is a C compiler for 8051 class and similar microcontrollers.
The packge includes the compiler, assemblers and linkers, a device
simulator and a core library. The processors supported (to a varying
degree) include the 8051, avr and z80.

%prep
%setup -n sdcc-2.2.2

%build
./configure --prefix=/usr/local
make all

%install
make prefix=$RPM_BUILD_ROOT/usr/local  install

%files

%attr(-,root,root) /usr/local/bin/sdcc
%attr(-,root,root) /usr/local/bin/sdcpp
%attr(-,root,root) /usr/local/bin/asx8051
%attr(-,root,root) /usr/local/bin/aslink
%attr(-,root,root) /usr/local/bin/packihx
%attr(-,root,root) /usr/local/bin/sdcdb
%attr(-,root,root) /usr/local/share/sdcc

%attr(-,root,root) /usr/local/bin/s51
%attr(-,root,root) /usr/local/bin/savr
%attr(-,root,root) /usr/local/bin/sz80

%attr(-,root,root) %doc /usr/local/doc/ucsim
