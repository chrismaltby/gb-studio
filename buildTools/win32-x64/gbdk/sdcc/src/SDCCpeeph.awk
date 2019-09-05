BEGIN {
	 print "/* Generated file, DO NOT Edit!  */"
	 print "/* To Make changes to rules edit */"
	 print "/* <port>/peeph.def instead.     */"
}

/^\/\// { next}

{ printf "\"" ;
  printf "%s",$0;
  print  "\\n\""; 
}


