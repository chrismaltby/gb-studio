#!/usr/bin/perl
$module = "unknown";
$modsub = 1;
$area = "CODE";

%dir_conv = (
	     '.org' => 'ORG',
	     '.include' => 'INCLUDE',
	     '.byte' => 'DB',
	     '.db' => 'DB',
	     '.dw' => 'DW',
	     '.ds' => 'DS',
	     '.blkw' => 'DS',
	     '.globl' => 'GLOBAL',
	     '.word' => 'DW'
);
%dir_drop = ( 
	     '.title' => 'x',
	     '.module' => 'x'
);
%dir_notab = (
	      '.if' => 'IF',
	      '.endif' => 'ENDC',
	      '.else' => 'ELSE'
);
%area_conv = (
	      '_HEADER' => 'HOME',
	      '_HEADER[ABS]' => 'HOME',
	      '_CODE' => 'CODE',
	      '_BSS' => 'BSS',
	      '_HOME' => 'HOME',
	      '_BASE' => 'HOME',
	      '_LIT', => 'HOME',
	      '_GSINIT' => 'HOME',
	      '_GSINITTAIL' => 'HOME',
	      '_GSFINAL' => 'HOME',
	      '_DATA' => 'BSS',
	      '_HEAP' => 'BSS',
	      '_SFR' => 'HRAM'
);
%label_conv = (
	       'A' => 'PAD_A',
	       'B' => 'PAD_B',
	       'DIV' => 'R_DIV',
	       'IF' => 'R_IF'
);

# Take a guess at the module name
$file = @ARGV[0];
if (defined($file)) {
  $module = `basename $file`;
  chomp $module;
}

# Emit the header
print "\t; Automagically from \"$module\" by $PROGRAM_NAME\n";

sub getnum {
  my($asc) = @_;
  if ($asc =~ /^0x(\w+)/) {
    $ret = "\$$1";
  }
  elsif ($asc =~ /^0b(\d+)/) {
    $ret = "\%$1";
  }
  else {
    $ret = $asc;
  }
  return $ret;
};

sub labelswap {
  my($label) = @_;
  my($ret);
  $ret = $label_conv{$label};
  if (not defined $ret) { 
    $ret = getnum $label;
  }
  return $ret;
}

sub labelconv {
  my($op) = @_;
  my($ret);
  $ret = $op;
  if ($op =~ /^\.(\w+)(\S*)/) {
    $ret = labelswap $1 . $2;
  }
  elsif ($op =~ /^(\w+)\$/) {
    $ret = ".l$1";
  }
  else {
    $ret = getnum $op;
  }
  return $ret;
}

sub splitarith {
  my($op) = @_;
  my($ret, @parts, @newparts, $part, $t);
  # Dont know how to do this so fake it
  $t = $op;
  $t =~ s/([\+\-\*\/\&\|]+)/ \1 /g;

  @parts = split / /, $t;
  foreach $part (@parts) {
    $t = labelconv($part);
    push @newparts, $t;
  }
  $t = join /\@/, @newparts;
  return $t;
}

sub convert {
  my($op) = @_;
  my($ret, $t);
  if ($op =~ /^\#(\S+)/) {
    $t = $1;
    if ($t =~ /^\>(\S+)/) {
      $ret = "(" . labelconv($1) . ">>8)";
    }
    elsif ($t =~ /^\<(\S+)/) {
      $ret = "(" . labelconv($1) . "&\$FF)";
    }
    # PC relative
    elsif ($t =~ /^\.([\+\-\d]+)/) {
      $ret = "\@$1";
    }
    else {
      $ret = splitarith $1;
    }
  }
  elsif ($op =~ /(\S*)\((\S+)\)/) {
    if ($op !~ /^BANK\(/) {
      $ret = "$1\[" . splitarith($2) . "]";
    }
    else {
      $ret = $op;
    }
  }
  else {
    $ret = splitarith $op;
  }
  return $ret;
}

while (<>) {
  # First strip off any comments
  ($_, $comments) = split /;+/;
  chomp;
  if (defined($comments)) {
    $comments = "; $comments";
    chomp $comments;
  }

  if (/^\S/) {
    ($label, $op, @operands) = split;
  }
  else {
    ($op, @operands) = split;
    $label = undef;
  }
  $operand = $operands[0];

  # Mangle the operand
  $newoperand = undef;
  foreach $op1 (split /,/, $operand) {
    $new = convert $op1;
    if (not defined($newoperand)) {
      $newoperand = $new;
    }
    else {
      $newoperand = "$newoperand,$new";
    }
  }
  $operand = $newoperand;

  # Handle A = 5
  if ($operand =~ /^\=/) {
    # Covert the name
    $op = convert $op;
    if ($op eq '__RGBDS__') {
      $operands[1] = '1';
    }
    print "$op\tEQU\t" . convert($operands[1]) . "\n";
  }
  # Handle directives
  elsif ($op =~ /^\./) {
    if ($op eq '.org') {
      $org = convert($operand);
      print "\tSECTION \"$module\_$modsub\",$area\[$org\]\n";
      $modsub++;
    }
    elsif ($op eq '.area') {
      $area = $area_conv{$operand};
      if (not defined $area) {
	die "Couldnt convert area \"$operand\"\n";
      }
      print "\tSECTION \"$module\_$modsub\",$area\n";
      $modsub++;
    }
    elsif ($op eq '.asciz') {
      # Note the @operands.
      print "\tDB\t@operands\,0\n";
    }
    elsif ($op eq '.ascii') {
      # Note the @operands.
      print "\tDB\t@operands\n";
    }      
    elsif ($op eq '.module') {
      $module = $operand;
      # And drop
    }
    elsif ($op eq '.include') {
      # Mangle the included file name
      # We use .asm for rgbds, and .s for asxxx
      if ($operand =~ /\"(\w+)\.s\"/) {
	print "\tINCLUDE \"$1.asm\"\n";
      }
      else {
	print "\tINCLUDE $operand\n";
      }
    }
    elsif (defined $dir_drop{$op}) {
      print "\t; Dropping $op $operand\n";
    }
    elsif (defined $dir_notab{$op}) {
      $conv = $dir_notab{$op};
      print "$conv\t$operand\t$comments\n";
    }
    else {
      $conv = $dir_conv{$op};
      if (not defined $conv) { 
	die "Couldnt convert $op ($conv)\n";
      }
      print "\t$conv\t$operand\t$comments\n";
    }
  }
  else {
    # Convert any labels
    if ($label =~ /^\.(\S+)/) {
      $label = $1;
    }
    elsif ($label =~ /^(\w+)\$\:/) {
      $label = ".l$1:";
    }
    # Convert the op to uppercase
    $op = uc $op;
    # Convert any special op-codes
    if ($op eq 'LDH') {
      $op = 'LD';
      $operand = uc $operand;
      ($first, $rest) = split /,/, $operand;
      if ($first =~ /^\[(\S+)\]/) {
	if ($1 eq 'C') {
	  # Do nothing
	}
	else {
	  $first = "\[\$FF00+$1\]";
	}
      }
      if ($rest =~ /^\[(\S+)\]/) {
	if ($1 eq 'C') {
	  # Do nothing
	}
	else {
	  $rest = "\[\$FF00+$1\]";
	}
      }
      $operand = "$first\,$rest";
    }
    elsif ($op eq 'LDA') {
      $operand = uc $operand;
      if ($operand =~ /^(\w+)\,([+-]*)(\S+)\[SP\]/) {
	$op = 'LD';
	$plusmin = $2;
	if ($plusmin == 0) {
	  $plusmin = "+";
	}
	if ($1 eq 'SP') {
	  $op = 'ADD';
	  $operand = "$1,$plusmin" . convert $3;
	}
	else {
	  $operand = "$1,[SP$plusmin" . convert $3 . "]";
	}
      }
    }
    if ($label eq "" && $op eq "" && $operand eq "") {
      print "\t$comments\n";
    }
    else {
      print "$label\t$op\t$operand\t$comments\n";
    }
  }
}

