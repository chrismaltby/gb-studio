#!/usr/bin/perl
# keil2sdcc.pl
# converts Keil compatible header files to sdcc-compatible format
# call (path)/keil2sdcc.pl keil_file_name sdcc_file_name
#
# Bela Torok - bela.torok@kssg.ch
# Version: June 2001
#
# Limitation: Keil-style sfr and sbit definitions should begin 
# in the first column! 
#

$keil_file = $ARGV[0];
$sdcc_file = $ARGV[1];

if (open (KEIL_FILE , "<" . $keil_file)) {  
#  printf("Opening file: %s for output!\n", $keil_file);
} else {
  printf("Cannot open file: %s !\n", $keil_file);
  exit (0);
}

if (open (SDCC_FILE ,">" . $sdcc_file)) {  
#  printf("Opening file: %s for output!\n", $sdcc_file);
} else {
  printf("Cannot open file: %s !\n", $sdcc_file);
  exit (0);
}

while ($input_buffer = <KEIL_FILE>) {

  if( substr($input_buffer, 0, 3) eq 'sfr') 
    {
      &convert( substr($input_buffer, 4) );
      print SDCC_FILE "sfr at", $value, " ", $name, ";", $comment;
    }
  elsif( substr($input_buffer, 0, 4) eq 'sbit') 
    {
      &convert( substr($input_buffer, 5) );
      print SDCC_FILE "sbit at", $value, " ", $name, ";", $comment;
    }
  else {
    print SDCC_FILE $input_buffer;
  }

}

close (KEIL_FILE);
close (SDCC_FILE);
exit (0);

sub convert
{
    local($arg) = @_;

    ($command, $comment) = split(';' , $arg);

    ($name, $value) = split('=' , $command);

}












