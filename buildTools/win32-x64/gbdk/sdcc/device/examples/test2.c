/******************************************************************************/
/*                                                                            */
/*   2HACES.C                                                                 */
/*                                                                            */
/******************************************************************************/
void watchdog();
unsigned char codigo(unsigned char, unsigned char, unsigned char, unsigned char);
void contestar();
void inicializar_registros();
void bajo_consumo();
unsigned char recibir_trama();
unsigned char contestar_si_error();
void configurar_haz0(unsigned char, unsigned char);
void configurar_haz1(unsigned char, unsigned char);
void telec_actualizacion();
void telec_conformacion(unsigned char);
void telec_temperatura();
void telec_pet_Estado();

/* Fichero de definición de direcciones de memoria
	asignadas a los diferentes registros */
#include <8051.h>

/* Direcciones de los puertos P4 y P5 y del TIMER3*/
sfr P4     = 0xC0;
sfr P5     = 0xC4;
sfr TIMER3 = 0xFF;
sfr ADCON  = 0xD8;
sfr ADAT   = 0xD7;

/* Dirección del bit que indica que hay una conversión A/D preparada */
#define AD_FIN               0x10

/*
  Valores que utilizamos para obtener el código de Hamming de los mensajes.
  El mensaje es de 29 bits (4 bytes) y la redundancia la tomamos de 11 bits.
  La matriz de Hamming asociada será por tanto de tamaño (11x29) bits.
  En las matrices siguiente colocamos la expresión hexadecimal de cada
  una de las columnas de la matriz de Hamming. La obtención de los bits de
  redundancia asociados a un mensaje los obtendremos haciendo la operación XOR
  entre las columnas de la matriz de Hamming correspondientes a los '1' de los 29
  bits del mensaje. Esto es más eficiente que realizar el producto matricial.
  Como la memoria está organizada en bytes, utilizamos dos matrices. En una de ellas,
  "Hamming_H", colocamos las tres primeras filas de la matriz de Hamming y en la otra,
  "Hamming_L",	las 8 filas restantes.
*/

#define Hamming_H0 0x0
#define Hamming_H1 0x1
#define Hamming_H2 0x2
#define Hamming_H3 0x1
#define Hamming_H4 0x6
#define Hamming_H5 0x5
#define Hamming_H6 0x2
#define Hamming_H7 0x7
#define Hamming_H8 0x8
#define Hamming_H9 0x3
#define Hamming_H10 0x9
#define Hamming_H11 0x6
#define Hamming_H12 0x2
#define Hamming_H13 0x9
#define Hamming_H14 0x4
#define Hamming_H15 0x4
#define Hamming_H16 0x3
#define Hamming_H17 0x8
#define Hamming_H18 0x7
#define Hamming_H19 0x6
#define Hamming_H20 0x0
#define Hamming_H21 0x8
#define Hamming_H22 0x7
#define Hamming_H23 0x6
#define Hamming_H24 0x9
#define Hamming_H25 0x2
#define Hamming_H26 0x3
#define Hamming_H27 0x7
#define Hamming_H28 0x3
#define Hamming_H29 0x3
#define Hamming_H30 0x3
#define Hamming_H31 0x3


/* Dirección del bit que inicia la conversión A/D */
#define AD_INI               0x08


/* Valores booleanos */
#define TRUE                 0x01
#define FALSE                0x00


/* Máscaras utilizadas para identificar los telecomandos */
#define CONFORMACION         0xC0
	  /* Telecomando que procesan todos los Subarrays. Se cambia el apuntamiento de la antena */

#define ACTUALIZACION        0x80
	  /*	Telecomando en el que se envía a un Subarray el próximo estado de uno de los haces */

#define TEMPERATURA          0x00
	  /* Telecomando en el que se solicita a un Subarray la temperatura del módulo T/R */

#define PETICION_ESTADO      0x40
	  /* Telecomando en el que se solicita a un Subarray el estado de programación de un haz */


/* Valores booleanos utilizados en las rutinas de recepción de tramas */
#define TIEMPO_EXCEDIDO      0x01
#define TIEMPO_NO_EXCEDIDO   0x00


/* Asociamos etiquetas a los identificadores que utiliza el
	compilador para designar algunos registros del micro */
#define ACUMULADOR           ACC
#define BUFFER_SERIE         SBUF
#define DATO_RECIBIDO        RI
#define DATO_ENVIADO         TI
#define PARIDAD_ACC          P
#define BIT_PARIDAD_REC      RB8
#define BIT_PARIDAD_TRA      TB8


/* Sustituimos por etiquetas algunas operaciones sencillas */
#define obtener_direc_mensaje  (BYTE[0] & 0x3F)
#define direccion_CONFORMACION (BYTE[1] & 0x3F)
#define obtener_tipo_mensaje   (BYTE[0] & 0xC0)
#define direc_subarray         ((P5 & 0x7E) >> 1)


/* DECLARACION DE VARIABLES */
volatile unsigned char int_serie;
unsigned char BYTE[5];
unsigned char BYTE_MENSAJE[3];
volatile unsigned char ERROR_PARIDAD;


/*
  Matriz que utilizamos para almacenar los estados predefinidos.
  En las posiciones pares (0,2,4,...) están los códigos de amplitud y en las
  impares (1,3,5,...) los de fase.
*/
unsigned char tabla_estados[20];


/*
  Matriz en la que almacenamos los índices a la tabla de estados correspondientes a la programación
  actual de los dos haces. Los índices tienen 11 bits de longitud. El contenido de la matriz es

		estado_haces[0] --> haz 0, i10...i3
		estado_haces[1] --> haz 0,  i2...i0
		estado_haces[2] --> haz 1, i10...i3
		estado_haces[3] --> haz 1,  i2...i0
*/
unsigned char estado_haces[4];


/*
  Función principal
*/
void main()
{
	unsigned char direc_mensaje;
	unsigned char TIMEOUT;
	unsigned char mensaje;
	unsigned char ERROR;
	unsigned char DIRECCION_SUBARRAY;

	inicializar_registros();

	/* Obtenemos la dirección del subarray */
	DIRECCION_SUBARRAY = direc_subarray;

	/* bucle del programa */
	while(1)
	{
		/* Bandera que utilizamos para determinar si la interrupción
			que se produce se ha originado en el puerto serie */
		int_serie = 0;

		/* El micro entra en modo de bajo consumo mientras no se
			produzca actividad en el puerto serie */
		while(int_serie == 0)
			bajo_consumo();

		/* Se ha detectado actividad en el bus de telecomandos. Capturamos la trama */
		TIMEOUT = recibir_trama();

		/* Si no se ha excedido el tiempo límite se procede a identificar el mensaje recibido */
		if (TIMEOUT == FALSE)
		{
			mensaje       = obtener_tipo_mensaje;
			direc_mensaje = obtener_direc_mensaje;

			if (direc_mensaje == DIRECCION_SUBARRAY)
				ERROR = contestar_si_error();

			/* Si no ha habido error en la recepción se procesa el telecomando */
			if (ERROR == FALSE)
			{
				switch(mensaje)
				{
					case CONFORMACION    :  telec_conformacion(DIRECCION_SUBARRAY);

                                                                break;

					case ACTUALIZACION   :  if (direc_mensaje == DIRECCION_SUBARRAY)
                                                                    telec_actualizacion();

                                                                break;

					case TEMPERATURA     :  if (direc_mensaje == DIRECCION_SUBARRAY)
                                                                    telec_temperatura();

                                                                break;

					case PETICION_ESTADO :  if (direc_mensaje == DIRECCION_SUBARRAY)
                                                                    telec_pet_Estado();

                                                                break;
				}
			}
		}
	}
	
}


/*
  Subrutina que actualiza el TIMER3 con el que se implementa la función WATCHDOG.
  Esta función se habilita conectando un pin externo a nivel bajo, y funciona de
  forma independiente al código que se ejecuta en el micro. Cuando el TIMER3 llega
  al final de la cuenta se produce un RESET del micro, por tanto, hay que habilitar
  un mecanismo de recarga del CONTADOR de forma que entre dos recargas no medie un
  tiempo mayor al que emplea la cuenta.
  Este tiempo oscila (para la frecuencia de reloj que utilizamos, 11.059 MHz) entre
  2.22 ms para una cuenta mínima y 569 ms para una cuenta máxima.
  Aquí usaremos el CONTADOR con cuenta máxima, para lo cual, dado que la cuenta
  es ascendente, el valor de recarga es 0.
  La recarga la haremos utilizando la interrupción que provoca el TIMER0 al llegar al
  final de la cuenta.
*/
void watchdog()
{
	PCON   |= 0x10;
	/*TIMER3  = 0x00;*/ 
}


/*
  Subrutina que atiende a la interrupción provocada por la UART del puerto serie
  cuando se ha recibido o enviado un carácter.
  En esta subrutina lo único que hacemos es poner el valor 1 en la variable 'int_serie'
  para indicar que la interrupción ocurrida es debida al puerto serie. Esto es necesario
  porque el micro sale del estado de bajo consumo mediante cualquier interrupción, y sólo
  queremos que lo haga cuando haya actividad en el puerto serie, de forma que si se produce
  alguna otra interrupción el micro chequea esta variable y si está a 0 vuelve a entrar en
  el estado de bajo consumo.

  La variable 'int_serie' se pone a cero siempre justo antes de entrar en el modo de bajo
  consumo, y es únicamente en esta subrutina donde se pone a valor uno.
*/
void sint(void) interrupt 4 using 2
{
	int_serie = 1;
}


/*
  Subrutina que atiende a la interrupción provocada por el TIMER0.
  Utilizamos esta interrupción para recargar el TIMER3 que relacionado con la operación del
  WATCHDOG.
  Esta interrupción se produce (para la frecuencia de reloj que utilizamos, 11.059 MHz) cada
  71.12 ms, lo que supone un margen de seguridad amplio frente a los 569 ms que emplea el
  TIMER3 en realizar una cuenta.
*/
void tint() interrupt 1 using 1
{
	/* Llamamos a la subrutina que actualiza el TIMER3 del 'watchdog' */
	watchdog();
}


/*
  Función que implementa la codificación de Hamming (40,32) del mensaje
  (tc1, tc2, tc3, tc4).
  La función devuelve la redundancia del mensaje de entrada en las variables "red" 
  Como ya hemos comentado al declarar la matriz 'Hamming', para no realizar producto de matriz
  por vector para calcular la redundancia, almacenamos la matriz generadora de Hamming como dos
  vectores de valores hexadecimales de longitud 29.
  Para obtener la redundancia lo que hacemos es realizar la operación XOR entre los valores del
  vectores "Hamming_H" cuyo índice coincide con los índices de los dígitos igual a '1'
  en la palabra mensaje.
  Para encontrar estos índices comparamos cada uno de los 4 bytes de que se compone el mensaje
  con las potencias de dos (2^7, 2^6, ... , 2^1, 2^0).
*/
unsigned char codigo(unsigned char tc1,unsigned char tc2,unsigned char tc3,unsigned char tc4)
{
	unsigned char red;

	if (tc1 != 0x00)
	{
		if (tc1 & 128) red ^= Hamming_H0;
		if (tc1 & 64 ) red ^= Hamming_H1;
		if (tc1 & 32 ) red ^= Hamming_H2;
		if (tc1 & 16 ) red ^= Hamming_H3;
		if (tc1 & 8  ) red ^= Hamming_H4;
		if (tc1 & 4  ) red ^= Hamming_H5;
		if (tc1 & 2  ) red ^= Hamming_H6;
		if (tc1 & 1  ) red ^= Hamming_H7;
	}

	if (tc2 != 0x00)
	{
		if (tc2 & 128) red ^= Hamming_H8;
		if (tc2 & 64 ) red ^= Hamming_H9;
		if (tc2 & 32 ) red ^= Hamming_H10;
		if (tc2 & 16 ) red ^= Hamming_H11;
		if (tc2 & 8  ) red ^= Hamming_H12;
		if (tc2 & 4  ) red ^= Hamming_H13;
		if (tc2 & 2  ) red ^= Hamming_H14;
		if (tc2 & 1  ) red ^= Hamming_H15;
	}

	if (tc3 != 0x00)
	{
		if (tc3 & 128) red ^= Hamming_H16;
		if (tc3 & 64 ) red ^= Hamming_H17;
		if (tc3 & 32 ) red ^= Hamming_H18;
		if (tc3 & 16 ) red ^= Hamming_H19;
		if (tc3 & 8  ) red ^= Hamming_H20;
		if (tc3 & 4  ) red ^= Hamming_H21;
		if (tc3 & 2  ) red ^= Hamming_H22;
		if (tc3 & 1  ) red ^= Hamming_H23;
	}

	if (tc4 != 0x00)
	{
		if (tc4 & 128) red ^= Hamming_H24;
		if (tc4 & 64 ) red ^= Hamming_H25;
		if (tc4 & 32 ) red ^= Hamming_H26;
		if (tc4 & 16 ) red ^= Hamming_H27;
		if (tc4 & 8  ) red ^= Hamming_H28;
		if (tc4 & 4  ) red ^= Hamming_H29;
		if (tc4 & 2  ) red ^= Hamming_H30;
		if (tc4 & 1  ) red ^= Hamming_H31;
	}

	return(red);
}


/*
  Subrutina que implementa el envío de mensajes en respuesta a los telecomandos recibidos.
  Los mensajes enviados son siempre de dos bytes más el byte de redundancia del código de Hamming.
  Para utilizar el mismo código en transmisión que en recepción, se añade un tercer byte con valor
  0 cuando se calcula la redundancia del mensaje a enviar. Esto mismo hace el módulo que recibe
  los mensajes que envían los subarrays para chequear la corrección de dichos mensajes.

  El proceso de envío es el siguiente.

  - Activar el 'driver' de transmisión.

  - Enviar 3 bytes del mensaje:
	* Calcular la paridad de cada byte y colarla en el registro de la UART etiquetado como
	  'BIT_PARIDAD_TRA'.
	* Colocar el byte a transmitir en el registro de salida 'BUFFER_SERIE'.
		  * Esperar que la UART indique en la bandera 'DATO_ENVIADO' que se ha enviado un byte
			 antes de enviar el siguiente.

  - Desactivar el 'driver' de transmisión.

  Para evitar que por alguna eventualidad la UART no actualice la bandera 'DATO_ENVIADO' y el
  programa quede indefinidamente esperando, utilizamos la variable 'CONTADOR' que se incrementa
  cada vez que hacemos una comprobación de la bandera. Cuando se llega a un valor límite no
  se hacen mas comprobaciones y se sigue enviando el resto del mensaje.
  Podríamos haber optado por abortar la transmisión en el caso de se llegue al valor límite de
  la cuenta, porque esto indicaría que se ha producido un error. Sin embargo continuamos la
  transmisión dejando que recaiga sobre el módulo que recibe los mensajes la responsabilidad de
  actuar frente a la detección de un error.
  Esto no supone ningún riesgo grave porque los mensajes de respuesta a telecomandos no afectan
  al estado de apuntamiento de la antena.
*/
void contestar()
{
	unsigned char CONTADOR;
	int num_byte;
	/*
	  Paridad impar. Metemos el bit de paridad en BIT_PARIDAD_TRA antes de mandar un byte.
	  En el "flag" PARIDAD_ACC tenemos la paridad del dato que hay en el ACUMULADOR.
	  Como la paridad es impar lo negamos
	*/

	/* Activar driver transmisión:
		(P3.2 a 0)                 */
	P3 &= 0xFB;

	for (num_byte = 0; num_byte <3; num_byte ++)
	{
      	ACUMULADOR      = BYTE_MENSAJE[num_byte];
        	BIT_PARIDAD_TRA = ~PARIDAD_ACC;
		BUFFER_SERIE    = ACUMULADOR;

        	/* Esperamos que el dato sea enviado */
		CONTADOR = 0;
        	while ((DATO_ENVIADO == 0) && (CONTADOR < 254))
			CONTADOR++;

        	/* Desactivamos el flag */
		DATO_ENVIADO = 0;
    	}

	/* Desactivar driver */
	P3 |= 0x04;
}


/*
  Subrutina que se ejecuta al comenzar a funcionar el microcontrolador
  y que adecua al cometido que ha de realizar el micro los valores en
  algunos registros.
*/
void inicializar_registros()
{
	/* Registro de interrupciones:
		habilitamos la interrupción del TIMER0 */
	IP =0x82;

	/* Puerto serie               */
	/* fosc = 11.059 MHz          */
	/* Transmisión a 9600 baudios */
	PCON = 0x00;
	TMOD = 0x21;
	SCON = 0xD0;

	/* Registros de los 'timers'                                   */
	/* Timer 1 en 'auto-reload' para generar velocidad transmisión */
	/* Usamos el TIMER0 para recargar el TIMER3 mientras se        */
	/* espera un nuevo comando                                     */
	/* El TIMER1 se usa para generar el 'baud-rate'                */
	/* Los timers son de 16 bits.                                  */
	TH1 = 0xFD;
	TL1 = 0x00;
	TH0 = 0xFF;
	TL0 = 0x00;

	/* Activamos los 'timers' */
	TR1 = 0x1;
	TR0 = 0x1;
}


/*
  Subrutina que hace que el micro entre en estado de bajo consumo
*/
void bajo_consumo()
{
	/* Habilitamos la interrupción del puerto serie */
	IE    = 0x92;

	/* Activamos el modo 'idle' de bajo consumo. De este modo se sale
			  cuando se produce alguna interrupción */
	PCON |= 1;

	/* Esta instrucción se ejecuta una vez que se ha salido del modo 'idle'
		Deshabilitamos la interrupción del puerto serie */
	IE    = 0x82;
}

/*
  Subrutina que realiza la recepción de los telecomandos. Todos tienen una longitud de 4 bytes
  más el byte del código de Hamming.
  Los bytes recibidos los coloca la UART en el registro 'BUFFER_SERIE', y el programa los coloca en las
  variables 'BYTE0...4'.
  La recepción de cada byte supone esperar que la bandera 'DATO_RECIBIDO' sea actualizada por la UART.
  Para evitar que por alguna eventualidad el programa pudiera quedar indefinidamente esperando que se
  actualizara dicha bandera se utiliza el mismo método que en la subrutina de enviar mensajes, la variable
  'CONTADOR' se incrementa a cada comprobación que se hace de la bandera. Si se alcanza un valor límite,
  en este caso, y a diferencia de la subrutina de transmisión, se aborta la recepción y se devuelve el valor
  'TIEMPO_EXCEDIDO' indicando que ha habido un error en la recepción.
  En este caso si que es obligado abortar el proceso puesto que de no hacerlo se podría provocar un
  funcionamiento incorrecto de la antena al ejecutar comandos erróneos.

  A cada byte recibido se le comprueba si la paridad es la correcta. Caso de no serlo se actualiza la variable
  global 'ERROR_PARIDAD' que evitará que se procesen telecomandos erróneos. Un error de paridad detectado no
  aborta la recepción. Lo que se hace es que una vez acabada se envía un mensaje indicando el error detectado.
*/
unsigned char recibir_trama()
{
	/*
		Variable que utilizaremos para evitar que el programa
		se quede esperando si se produce una interrupción en
		el puerto serie, pero no llega ningún dato
	*/
	unsigned char CONTADOR;

	/* Indice del byte que se está recibiendo */
      unsigned char num_byte;

	/* Ponemos a cero el indicador de error en la paridad de los datos recibidos */
	ERROR_PARIDAD = 0;

	/* Bucle de recepción */
	for (num_byte = 0; num_byte < 5; num_byte ++)
	{
		CONTADOR = 0;

		/* esperamos que haya un dato válido */
		while((DATO_RECIBIDO == 0) && (CONTADOR < 254))
			CONTADOR++;

		/* Si no ha llegado ningún dato salimos de la función			y devolvemos una señal indicándolo */
		if (CONTADOR == 254)
			return TIEMPO_EXCEDIDO;

		/* Desactivamos el "flag" */
		DATO_RECIBIDO = 0;

		/* Almacenamos el dato que ha llegado */
		BYTE[num_byte] = BUFFER_SERIE;
		ACUMULADOR = BYTE[num_byte];

		/* Determinamos la paridad del dato recibido. 'PARIDAD_ACC' indica si el dato en el acumulador
		tiene paridad par. Por tanto, habrá un error de paridad cuando la paridad recibida sea la misma
		que indica 'PARIDAD_ACC' */
		if (BIT_PARIDAD_REC == PARIDAD_ACC)
			ERROR_PARIDAD = 1;
	}


	/* transmisión terminada */
	return TIEMPO_NO_EXCEDIDO;
}


/*
  Subrutina que envía un mensaje de error si ha ocurrido alguna de las dos situaciones siguientes:

  - Se ha detectado un error de paridad en al recepción de algún byte del último telecomando.

  - El código de Hamming recibido no coincide con el que realmente corresponde a los cuatro bytes
	 del mensaje recibido.

  En cada ocasión únicamente contesta un Subarray puesto que cada telecomando lleve incluido un campo
  que identifica al Subarray direccionado, incluso cuando el telecomando es global. En este último caso
  la dirección del Subarray está en el segundo byte del mensaje y en el resto de los casos en el primero.
  La subrutina devuelve un indicador de si ha habido error.
*/
unsigned char contestar_si_error()
{
    BYTE_MENSAJE[2] = codigo(BYTE[0], BYTE[1], BYTE[2], BYTE[3]);

	if ((ERROR_PARIDAD == 1) || (BYTE[4] != BYTE_MENSAJE[2]))
	{
	      BYTE_MENSAJE[0] = BYTE_MENSAJE[1] = BYTE_MENSAJE[1] = 0x00;
		contestar();
		return TRUE;
	}

	else
		return FALSE;
}


/**********************************************************************************/
/*   MAPEADO DE LAS LINEAS DE CONTROL DE LOS DOS HACES CON LOS PUERTOS DEL MICRO  */
/*										  */
/*   Simbolización: Haz 1, bit 2 de Amplitud -> H1A2				  */
/*                  Haz 0, bit 0 de Fase     -> H0F0				  */
/*										  */
/* 		      | BIT0 | BIT1 | BIT2 | BIT3 | BIT4 | BIT5 | BIT6 | BIT7 |   */
/*                    |      |      |      |      |      |      |      |      |   */
/*   PUERTO 0 -> P0   |	H0A9 |      |      |      |      |      |      |      |   */
/*        	      |      |      |      |      |      |      |      |      |   */
/*   PUERTO 1 -> P1   |	H1F0 | H1F1 | H1F2 | H1F3 | H1F4 | H0F0 | H0F1 | H0F2 |   */
/*                    |      |      |      |      |      |      |      |      |   */
/*   PUERTO 2 -> P2   |	H0A0 | H0A1 | H0A2 | H0A3 | H0A4 | H0A5 | H0A6 | H0A7 |   */
/*    	              |      |      |      |      |      |      |      |      |   */
/*   PUERTO 3 -> P3   |      |      |      | H1A8 | H1A9 | H0F3 | H0F4 | H0A8 |   */
/*                    |      |      |      |      |      |      |      |      |   */
/*   PUERTO 4 -> P4   |	H1A0 | H1A1 | H1A2 | H1A3 | H1A4 | H1A5 | H1A6 | H1A7 |   */
/*										  */
/**********************************************************************************/


/*
  Subrutina que configura el HAZ 0.
  Los valores de las líneas H9..H0 se obtienen según las siguientes expresiones:

	H9 <-- ~A0
	H8 <-- (~A3 & A2) | (A3 & A1)
	H7 <-- (~A3 & A1) | (A3 & A2)
	H6 <-- A3 | (A1 & ~A2)
	H5 <-- A3 | A2
	H4 <-- ~A1
	H3 <-- ~A2
	H2 <-- ~A3
	H1 <-- A4
	H0 <-- ~A4

  donde, '~', '|' y '&' representan la negación, la operación OR y la operación AND
  binaria, respectivamente.
*/
void configurar_haz0(unsigned char amplitud, unsigned char fase)
{
	unsigned char conf_P2  = 0x00;

	/* ponemos a cero los bits de los puertos que vamos a cambiar mediante una operación 'OR' */
	P0 &= 0xFE;
	P1 &= 0x1F;
	P3 &= 0x1F;

	/* H0 */
	conf_P2 |= (~(amplitud & 0x10))* 0x01;  

	/* H1 */
	conf_P2 |=   (amplitud & 0x10) * 0x02;

	/* H2 */
	conf_P2 |= (~(amplitud & 0x08))* 0x04;

	/* H3 */
	conf_P2 |= (~(amplitud & 0x04))* 0x08;

	/* H4 */
	conf_P2 |= (~(amplitud & 0x02))* 0x10;

	/* H5 */
	conf_P2 |= ((amplitud & 0x08) | (amplitud & 0x04))* 0x20;

	/* H6 */
	conf_P2 |= ((amplitud & 0x08) | ((amplitud & 0x02)&(~(amplitud & 0x04))))* 0x40;

	/* H7 */
	conf_P2 |= (((amplitud & 0x08)&(amplitud & 0x04)) | ((amplitud & 0x02)&(~(amplitud & 0x08))))* 0x80;

	/* H8 */
	P3 |= (((amplitud & 0x08)&(amplitud & 0x02)) | ((amplitud & 0x04)&(~(amplitud & 0x08))))* 0x80;
	/* H9 */
	P0 |= (~(amplitud & 0x01)) * 0x01;

	/* Actualizamos el puerto P2 */
	P2 = conf_P2;

	/* Actualizamos el puerto P1 */	
	P1 |= (fase & 0x07) << 5;

	/* Actualizamos el puerto P3 */
	P3 |= (fase & 0x18) << 2;
}


/*
  Subrutina que configura el HAZ 1.
*/
void configurar_haz1(unsigned char amplitud, unsigned char fase)
{
	unsigned char conf_P4 = 0x00;

	/* ponemos a cero los bits de los puertos que vamos a cambiar mediante una operación 'OR' */
	P1 &= 0xE0;
	P3 &= 0xE7;

	/* H0 */
	conf_P4 |= (~(amplitud & 0x10))* 0x01;  

	/* H1 */
	conf_P4 |=   (amplitud & 0x10) * 0x02;

	/* H2 */
	conf_P4 |= (~(amplitud & 0x08))* 0x04;

	/* H3 */
	conf_P4 |= (~(amplitud & 0x04))* 0x08;

	/* H4 */
	conf_P4 |= (~(amplitud & 0x02))* 0x10;

	/* H5 */
	conf_P4 |= ((amplitud & 0x08) | (amplitud & 0x04))* 0x20;

	/* H6 */
	conf_P4 |= ((amplitud & 0x08) | ((amplitud & 0x02)&(~(amplitud & 0x04))))* 0x40;

	/* H7 */
	conf_P4 |= (((amplitud & 0x08)&(amplitud & 0x04)) | ((amplitud & 0x02)&(~(amplitud & 0x08))))* 0x80;

	/* H8 */
	P3 |= (((amplitud & 0x08)&(amplitud & 0x02)) | ((amplitud & 0x04)&(~(amplitud & 0x08))))* 0x08;
	/* H9 */
	P3 |= (~(amplitud & 0x01)) * 0x10;

	/* Actualizamos el puerto P4 */
	P4 = conf_P4;

	/* Actualizamos el puerto P1 */	
	P1 |= fase;	
}


/*
  Telecomando en el que se envía a un Subarray concreto para actualizar uno de los estados de programación
  predefinidos.
  El índice del estado consta de bits contenidos en BYTE1
  Los 10 bits de la palabra del nuevo estado están en:
		5 bits de amplitud en BYTE2[4..0]
		5 bits de fase en     BYTE3[7..3]
*/
void telec_actualizacion()
{
	unsigned char fase, amplitud, fila, columna, i, p;

	/* Obtenemos la columna correspondiente al estado que se actualiza */
	/* dentro de la matriztabla_estados                                */
	columna = 1 << (BYTE[1] & 0x07);

	/* Obtenemos la fila */
	fila = (BYTE[1] >> 3) * 0x0A;

	/* Obtenemos el valor de la fase */
	fase = BYTE[3];

	/* Obtenemos el valor de la amplitud */
	amplitud = BYTE[2];

	/* Actualizamos la tabla                                           */
	for (i = 0x00, p = 0x01; i < 0x05; i++, p <<= 1)
	{
		/* Colocamos un '0' en todas las posiciones correspondientes */
		/* al estado                                                 */
		tabla_estados[fila+i  ] &= 0xFF ^ columna;
		tabla_estados[fila+i+5] &= 0xFF ^ columna;

		/* Según el valor de amplitud y fase colocamos un '1' en las */
		/* posiciones correspondientes                               */
		if (amplitud & p) tabla_estados[fila+i  ] |= columna;
		if (fase     & p) tabla_estados[fila+i+5] |= columna;
	}		


	/* Contestamos indicando que no ha habido error.
			 Los bytes del mensaje de respuesta son 0xFC y 0x00,
			 y completa la palabra código Hamming el byte 0x76.
	*/
	BYTE_MENSAJE[0] = 0xFF;
	BYTE_MENSAJE[1] = 0x00;
	BYTE_MENSAJE[2] = 0x76;
	contestar();
}


/*
  Subrutina que actualiza con la nueva programación las líneas de control de la red desfasadora
  y atenuadora.
  La variable 'haz_conformado' contiene la información sobre el haz que hay que reprogramar.
*/
void telec_conformacion(unsigned char DIRECCION_SUBARRAY)
{
	unsigned char haz_conformado, amplitud = 0x00, fase = 0x00, fila, columna, i, p;

	/* Obtenemos la columna dentro de la matriz tabla_estados */
	columna = 1 << (BYTE[1] & 0x07);

	/* Obtenemos la fila */
	fila = (BYTE[1] >> 3) * 0x0A;

	/* Obtenemos el haz que se reprograma */
	haz_conformado = BYTE[3];

	/* Obtenemos los valores de las palabras de amplitud y fase */
	for (i = 0x00, p = 0x01; i < 0x05; i++, p <<= 1)
	{
		if (tabla_estados[fila+i  ] & columna) amplitud |= p;
		if (tabla_estados[fila+i+5] & columna) fase     |= p;
	}		
	
	/* Colocamos los valores correspondientes en
		las líneas de control */
	if (haz_conformado == 0x00)
	{
		estado_haces[0] = amplitud;
		estado_haces[1] = fase;
		configurar_haz0(amplitud, fase);
	}

	if (haz_conformado == 0x01)
	{
		estado_haces[2] = amplitud;
		estado_haces[3] = fase;
		configurar_haz1(amplitud, fase);
	}

	/* Contestar, si corresponde, que no habido error */	
	if (direccion_CONFORMACION == DIRECCION_SUBARRAY)
	{
		BYTE_MENSAJE[0] = 0xFF;
		BYTE_MENSAJE[1] = 0x00;
		BYTE_MENSAJE[2] = 0x76;
		contestar();
	}
}


/*
  Subrutina que realiza la adquisición de la temperatura del módulo T/R.
  La conversión analógica es de 10 bits.
  El mensaje se compone de dos bytes más el código de Hamming con la siguiente distribución:

			  MSB                                LSB
	BYTE1 : 0    0    0    0    0    0    T9   T8
	BYTE2 : T7   T6   T5   T4   T3   T2   T1   T0   
	BYTE3 : H7   H6   H5   H4   H3   H2   H1   H0

  donde T9..T0 son los 10 bits de la lectura de la temperatura y
  H7..H0 son los 8 bits de la redundancia de Hamming.
*/
void telec_temperatura()
{
	unsigned char CONTADOR;

	/* Reseteamos el registro de control del conversor A/D */
	ADCON = 0x00;

	/* Activar la conversión A/D */
	ADCON = ADCON | AD_INI;

	/* Esperamos a que termine el muestreo.
		Con la variable contador establecemos un tiempo límite de espera */
	CONTADOR = 0;
	while (((ADCON & AD_FIN) == 0) || (CONTADOR == 250))
		CONTADOR++;

	/* Si se ha superado el tiempo de espera enviamos mensaje de error */
	if (CONTADOR == 250)
	{   
		BYTE_MENSAJE[0] = BYTE_MENSAJE[1] = BYTE_MENSAJE[2] = 0x00;
		contestar();
		return;
	}

	/* Realizamos la lectura del conversor */
	BYTE_MENSAJE[0] = (ADCON & 0xC0) >> 6;
	BYTE_MENSAJE[1] = ADAT;

	/* Calculamos la palabra código */
	BYTE_MENSAJE[2] = codigo(BYTE_MENSAJE[0], BYTE_MENSAJE[1], 0x00, 0x00);

	/* Enviamos respuesta */
	contestar();
}


/*
  Subrutina que implementa dos funciones:

  - Envía un mensaje en respuesta a un telecomando de petición de estado con la
	 programación actual del haz solicitado, información que está contenida en la
	 variable 'tabla_estados' en la forma siguiente:
	* tabla_haces_prog[2*haz]   <- Amplitud (5bits)
	* tabla_haces_prog[2*haz+1] <- Fase     (5bits)

	 El mensaje se compone de dos bytes más el código de Hamming con la siguiente distribución:

				  MSB                                LSB
		BYTE1 : 0    0    0    A4   A3   A2   A1   A0
		BYTE2 : 0    0    0    F4   F3   F2   F1   F0
		BYTE3 : H7   H6   H5   H4   H3   H2   H1   H0

  - Provoca un RESET del microcontrolador cuando el telecomando de petición de temperatura
	 tiene el segundo byte igual a 0xFF.
	 Este RESET intencionado se utiliza cuando el módulo que distribuye los mensajes a los distintos
	 subarrays detecta que hay un error en el bus de telemedidas que persiste cuando se dirige a un
	 subarray en particular, o bien hay un subarray que no contesta. Estas anomalías posiblemente son
	 debidas a que un subarray por cualquier motivo desconocido ha sufrido un error en la posición de
	 memoria donde almacena la dirección que lo identifica, de forma que hay dos subarrays con la misma
	 dirección o bien un subarray tiene una dirección no válida (superior a 51, dirección máxima).
*/
void telec_pet_Estado()
{
	unsigned char haz;

	/* Comprobamos si se trata de un comando de reset */
	/* En caso afirmativo entramos en un bucle vacío  */
	/* para que se provoque un reset */
	if (BYTE[1] == 0xFF)
	{
		/* 
		  Deshabilitamos las interrupciones de forma que el TIMER0 no 
		  pueda activar la rutina 'watchdog()' y se produzca un RESET.
		*/
		IE = 0x00;

		/* Bucle infinito */
		while(1);
	}


	/* Si el telecomando es efectivamente de petición */
	/* de estado obtenemos el haz direccionado        */
	haz = BYTE[2];

	/* Construimos los bytes de respuesta             */
	BYTE_MENSAJE[0] = estado_haces[2*haz];
	BYTE_MENSAJE[1] = estado_haces[2*haz+1];

	BYTE_MENSAJE[2] = codigo(BYTE_MENSAJE[0], BYTE_MENSAJE[1], 0x00, 0x00);

	/* Enviamos mensaje de respuesta                  */
	contestar();
}


