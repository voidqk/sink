// (c) Cyright 2016, Sean Connelly (@voidqk), http://syntheti.cc
// MIT License
// Project Home: https://github.com/voidqk/sink

#include "sink.h"

static volatile bool done = false;

#if defined(SINK_POSIX) || defined(SINK_MACOSX)

#include <signal.h>

static void catchdone(int dummy){
	fclose(stdin);
	done = true;
}

static inline void catchint(){
	signal(SIGINT, catchdone);
	signal(SIGSTOP, catchdone);
}

#else
#	error Don't know how to catch Ctrl+C for other platforms
#endif

static inline void printline(int line, int level){
	if (line < 10)
		printf(" %d", line);
	else
		printf("%d", line);
	if (level <= 0)
		printf(": ");
	else{
		printf(".");
		for (int i = 0; i < level; i++)
			printf("..");
		printf(" ");
	}
}

static int main_repl(){
	sink_repl repl = sink_repl_new(NULL, sink_stdio, sink_stdinc);
	int line = 1;
	int bufsize = 0;
	int bufcount = 200;
	char *buf = malloc(sizeof(char) * bufcount);
	if (buf == NULL){
		fprintf(stderr, "Out of memory!\n");
		return 1;
	}
	catchint();
	printline(line, sink_repl_level(repl));
	while (!done){
		int ch = fgetc(stdin);
		if (ch == EOF){
			ch = '\n';
			done = true;
		}
		if (bufsize >= bufcount - 1){ // make sure there is always room for two chars
			bufcount += 200;
			buf = realloc(buf, sizeof(char) * bufcount);
			if (buf == NULL){
				fprintf(stderr, "Out of memory!\n");
				return 1;
			}
		}
		buf[bufsize++] = ch;
		if (ch == '\n'){
			if (bufsize > 1){
				char *err = sink_repl_write(repl, (uint8_t *)buf, bufsize);
				if (err){
					printf("Error: %s\n", err);
					sink_repl_reset(repl);
				}
				if (sink_repl_done(repl))
					done = true;
				else
					printline(++line, sink_repl_level(repl));
			}
			bufsize = 0;
		}
	}
	free(buf);
	int res = sink_repl_result(repl);
	if (res == 2)
		fprintf(stderr, "Invalid code generation\n");
	sink_repl_free(repl);
	return res;
}

int main_run(const char *inFile, char *const *argv, int argc){
	FILE *fp = fopen(inFile, "rb");
	if (fp == NULL){
		fprintf(stderr, "Failed to open file: %s\n", inFile);
		return 1;
	}

	fseek(fp, 0, SEEK_END);
	long bufSize = ftell(fp);
	fseek(fp, 0, SEEK_SET);
	char *buf = malloc(sizeof(char) * bufSize);
	fread(buf, sizeof(char), bufSize, fp);
	fclose(fp);

	sink_cmp cmp = sink_cmp_new(inFile, sink_stdinc);
	char *err = sink_cmp_write(cmp, (uint8_t *)buf, (int)bufSize);
	free(buf);
	if (err){
		fprintf(stderr, "Error: %s\n", err);
		sink_cmp_free(cmp);
		return 1;
	}
	err = sink_cmp_close(cmp);
	if (err){
		fprintf(stderr, "Error: %s\n", err);
		sink_cmp_free(cmp);
		return 1;
	}

	sink_prg prg = sink_cmp_getprg(cmp);
	sink_cmp_free(cmp);
	sink_ctx ctx = sink_ctx_new(NULL, prg, sink_stdio);
	int res = sink_ctx_run(ctx);
	if (res == 2)
		fprintf(stderr, "Invalid code generation\n");
	sink_ctx_free(ctx);
	sink_prg_free(prg);
	return res;
}

void printVersion(){
	printf(
		"Sink v1.0\n"
		"Copyright (c) 2016 Sean Connelly (@voidqk), MIT License\n"
		"https://github.com/voidqk/sink  http://syntheti.cc\n");

}

void printHelp(){
	printVersion();
	printf(
		"\nUsage:\n"
		"  sink                           Read-eval-print loop\n"
		"  sink <file> [arguments]        Run file with arguments\n"
		"  sink -e '<code>' [arguments]   Run '<code>' with arguments\n"
		"  sink -c <file>                 Compile file to bytecode\n"
		"  sink -v                        Print version information\n");
}

int main(int argc, char **argv){
	int mode = 0;
	char *evalLine = NULL;
	char *inFile = NULL;
	char **args = NULL;
	int argsSize = 0;

	for (int i = 1; i < argc; i++){
		switch (mode){
			case 0: // unknown
				if (strcmp(argv[i], "-v") == 0)
					mode = 1;
				else if (strcmp(argv[i], "-c") == 0)
					mode = 2;
				else if (strcmp(argv[i], "-e") == 0)
					mode = 3;
				else if (strcmp(argv[i], "--") == 0)
					mode = 4;
				else if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0){
					printHelp();
					return 0;
				}
				else{
					mode = 5;
					inFile = argv[i];
				}
				break;

			case 1: // version
				printHelp();
				return 1;

			case 2: // compile
				if (inFile == NULL)
					inFile = argv[i];
				else{
					printHelp();
					return 1;
				}
				break;

			case 3: // eval
				if (evalLine == NULL)
					evalLine = argv[i];
				else{
					if (args == NULL){
						args = malloc(sizeof(char *) * (argc - i));
						if (args == NULL){
							fprintf(stderr, "Out of memory!\n");
							return 1;
						}
					}
					args[argsSize++] = argv[i];
				}
				break;

			case 4: // rest
				inFile = argv[i];
				mode = 5;
				break;

			case 5: // run
				if (args == NULL){
					args = malloc(sizeof(char *) * (argc - i));
					if (args == NULL){
						fprintf(stderr, "Out of memory!\n");
						return 1;
					}
				}
				args[argsSize++] = argv[i];
				break;
		}
	}

	switch (mode){
		case 0: // unknown
			return main_repl();
		case 1: // version
			printVersion();
			return 0;
		case 2: // compile
			printf("TODO: compile\n");
			abort();
			return 1;
		case 3: // eval
			if (evalLine == NULL){
				printHelp();
				return 1;
			}
			printf("TODO: eval\n");
			abort();
			return 1;
		case 4: // rest
			return main_repl();
		case 5: { // run
			int res = main_run(inFile, args, argsSize);
			if (args)
				free(args);
			return res;
		}
	}

	return 0;
}