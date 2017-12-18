// (c) Copyright 2016-2017, Sean Connelly (@voidqk), http://syntheti.cc
// MIT License
// Project Home: https://github.com/voidqk/sink

export enum sink_type {
	NIL,
	NUM,
	STR,
	LIST
}
export type sink_str = string;
export type sink_valtrue = number | sink_str | sink_list;
export type sink_val = null | sink_valtrue;
export type sink_user = number;
export class sink_list extends Array<sink_val> {
	usertype: sink_user;
	user: any;
	constructor(...args: sink_val[]) {
		super();
		args.unshift(0);
		args.unshift(0);
		this.splice.apply(this, args);
		this.usertype = -1;
		this.user = null;
	}
}

export type sink_u64 = [number, number]; // uint64_t is stored as two 32-bit numbers

export type sink_ctx = any;
export type sink_scr = any;

export enum sink_fstype {
	NONE,
	FILE,
	DIR
}

export type sink_output_f = (ctx: sink_ctx, str: sink_str, iouser: any) =>
	undefined | Promise<undefined>;
export type sink_input_f = (ctx: sink_ctx, str: sink_str, iouser: any) =>
	sink_val | Promise<sink_val>;
export type sink_native_f = (ctx: sink_ctx, args: sink_val[], natuser: any) =>
	sink_val | Promise<sink_val>;
export type sink_fstype_f = (file: string, incuser: any) =>
	sink_fstype | Promise<sink_fstype>;
export type sink_fsread_f = (scr: sink_scr, file: string, incuser: any) =>
	boolean | Promise<boolean>;
export type sink_dump_f = (data: string, dumpuser: any) => boolean | Promise<boolean>;

export interface sink_io_st {
	f_say?: sink_output_f;
	f_warn?: sink_output_f;
	f_ask?: sink_input_f;
	user?: any;
}

export interface sink_inc_st {
	f_fstype: sink_fstype_f;
	f_fsread: sink_fsread_f;
	user: any;
}

export enum sink_run {
	PASS,
	FAIL,
	TIMEOUT,
	REPLMORE
}

export enum sink_ctx_status {
	READY,
	WAITING,
	PASSED,
	FAILED
}

export const SINK_NAN = Number.NaN;
export const SINK_NIL = null;

function isPromise<T>(p: any): p is Promise<T> {
	return typeof p === 'object' && p !== null && typeof (<Promise<T>>p).then === 'function';
}

function checkPromise<T, U>(v: T | Promise<T>, func: (v2: T) => U | Promise<U>): U | Promise<U> {
	if (isPromise<T>(v))
		return v.then(func);
	return func(v);
}

export function sink_bool(f: boolean): sink_val { return f ? 1 : SINK_NIL; }
export function sink_istrue(v: sink_val): v is sink_valtrue { return v !== SINK_NIL; }
export function sink_isfalse(v: sink_val): v is null { return v === SINK_NIL; }
export function sink_isnil(v: sink_val): v is null { return v === SINK_NIL; }
export function sink_isasync(v: sink_val | Promise<sink_val>): v is Promise<sink_val> {
	return isPromise<sink_val>(v);
}
export function sink_isstr(v: sink_val): v is sink_str { return typeof v === 'string'; }
export function sink_islist(v: sink_val): v is sink_list {
	return typeof v === 'object' && v !== null;
}
export function sink_isnum(v: sink_val): v is number { return typeof v === 'number'; }
export function sink_typeof(v: sink_val): sink_type {
	if      (sink_isnil  (v)) return sink_type.NIL;
	else if (sink_isstr  (v)) return sink_type.STR;
	else if (sink_islist (v)) return sink_type.LIST;
	else                      return sink_type.NUM;
}
export function sink_castnum(v: sink_val): number {
	if (!sink_isnum(v))
		throw new Error('Cannot cast non-number to number.');
	return v;
}
export function sink_caststr(str: sink_val): string {
	if (!sink_isstr(str))
		throw new Error('Cannot cast non-string to string.');
	return str;
}
export function sink_castlist(ls: sink_val): sink_list {
	if (!sink_islist(ls))
		throw new Error('Cannot cast non-list to list.');
	return ls;
}

export function sink_nil(): sink_val { return SINK_NIL; }

export function sink_num(v: number): sink_val { return v; }
export function sink_num_nan(): sink_val { return SINK_NAN; }
export function sink_num_inf(): sink_val { return Infinity; }
export function sink_num_isnan(v: sink_val): boolean { return typeof v === 'number' && isNaN(v); }
export function sink_num_isfinite(v: sink_val): boolean {
	return typeof v === 'number' && isFinite(v);
}
export function sink_num_e(): number { return Math.E; }
export function sink_num_pi(): number { return Math.PI; }
export function sink_num_tau(): number { return Math.PI * 2; }

export function sink_user_new(ctx: sink_ctx, usertype: sink_user, user: any): sink_val {
	//let hint = sink_ctx_getuserhint(ctx, usertype);
	//let ls = new sink_list(hint);
	//sink_list_setuser(ctx, ls, usertype, user);
	//return ls;
	return new sink_list('TODO: this');
}

export function sink_isuser(ctx: sink_ctx, v: sink_val, usertype: sink_user): [boolean, any] {
	if (!sink_islist(v))
		return [false, null];
	if (v.usertype !== usertype)
		return [false, null];
	return [true, v.user];
}

function wrap_clock(): number { return (new Date()).getTime(); }
export let sink_seedauto_src: () => number = wrap_clock;

function byteequ(b: number[], str: string): boolean { // TODO: do I actually need this?
	let i: number;
	for (i = 0; i < str.length; i++){
		if (b.length <= i)
			return false;
		if (b[i] !== str.charCodeAt(i))
			return false;
	}
	return b.length === i;
}

function list_byte_equ(b1: number[], b2: number[]): boolean {
	if (b1.length !== b2.length)
		return false;
	for (let i = 0; i < b1.length; i++){
		if (b1[i] !== b2[i])
			return false;
	}
	return true;
}

class list_u64 extends Array<sink_u64> {
}

interface varloc_st {
	frame: number;
	index: number;
}

function varloc_new(frame: number, index: number): varloc_st {
	return { frame: frame, index: index };
}

const VARLOC_NULL: varloc_st = { frame: -1, index: -1 };

function varloc_isnull(vlc: varloc_st): boolean {
	return vlc.frame < 0;
}

function native_hash(bytes: string): sink_u64 {
	let hash = sink_str_hashplain(bytes, 0);
	return [hash[0], hash[1]];
}

enum op_enum {
	NOP             = 0x00,
	MOVE            = 0x01,
	INC             = 0x02,
	NIL             = 0x03,
	NUMP8           = 0x04,
	NUMN8           = 0x05,
	NUMP16          = 0x06,
	NUMN16          = 0x07,
	NUMP32          = 0x08,
	NUMN32          = 0x09,
	NUMDBL          = 0x0A,
	STR             = 0x0B,
	LIST            = 0x0C,
	ISNUM           = 0x0D,
	ISSTR           = 0x0E,
	ISLIST          = 0x0F,
	NOT             = 0x10,
	SIZE            = 0x11,
	TONUM           = 0x12,
	CAT             = 0x13,
	LT              = 0x14,
	LTE             = 0x15,
	NEQ             = 0x16,
	EQU             = 0x17,
	GETAT           = 0x18,
	SLICE           = 0x19,
	SETAT           = 0x1A,
	SPLICE          = 0x1B,
	JUMP            = 0x1C,
	JUMPTRUE        = 0x1D,
	JUMPFALSE       = 0x1E,
	CMDHEAD         = 0x1F,
	CMDTAIL         = 0x20,
	CALL            = 0x21,
	NATIVE          = 0x22,
	RETURN          = 0x23,
	RETURNTAIL      = 0x24,
	RANGE           = 0x25,
	ORDER           = 0x26,
	SAY             = 0x27,
	WARN            = 0x28,
	ASK             = 0x29,
	EXIT            = 0x2A,
	ABORT           = 0x2B,
	STACKTRACE      = 0x2C,
	NUM_NEG         = 0x2D,
	NUM_ADD         = 0x2E,
	NUM_SUB         = 0x2F,
	NUM_MUL         = 0x30,
	NUM_DIV         = 0x31,
	NUM_MOD         = 0x32,
	NUM_POW         = 0x33,
	NUM_ABS         = 0x34,
	NUM_SIGN        = 0x35,
	NUM_MAX         = 0x36,
	NUM_MIN         = 0x37,
	NUM_CLAMP       = 0x38,
	NUM_FLOOR       = 0x39,
	NUM_CEIL        = 0x3A,
	NUM_ROUND       = 0x3B,
	NUM_TRUNC       = 0x3C,
	NUM_NAN         = 0x3D,
	NUM_INF         = 0x3E,
	NUM_ISNAN       = 0x3F,
	NUM_ISFINITE    = 0x40,
	NUM_SIN         = 0x41,
	NUM_COS         = 0x42,
	NUM_TAN         = 0x43,
	NUM_ASIN        = 0x44,
	NUM_ACOS        = 0x45,
	NUM_ATAN        = 0x46,
	NUM_ATAN2       = 0x47,
	NUM_LOG         = 0x48,
	NUM_LOG2        = 0x49,
	NUM_LOG10       = 0x4A,
	NUM_EXP         = 0x4B,
	NUM_LERP        = 0x4C,
	NUM_HEX         = 0x4D,
	NUM_OCT         = 0x4E,
	NUM_BIN         = 0x4F,
	INT_NEW         = 0x50,
	INT_NOT         = 0x51,
	INT_AND         = 0x52,
	INT_OR          = 0x53,
	INT_XOR         = 0x54,
	INT_SHL         = 0x55,
	INT_SHR         = 0x56,
	INT_SAR         = 0x57,
	INT_ADD         = 0x58,
	INT_SUB         = 0x59,
	INT_MUL         = 0x5A,
	INT_DIV         = 0x5B,
	INT_MOD         = 0x5C,
	INT_CLZ         = 0x5D,
	INT_POP         = 0x5E,
	INT_BSWAP       = 0x5F,
	RAND_SEED       = 0x60,
	RAND_SEEDAUTO   = 0x61,
	RAND_INT        = 0x62,
	RAND_NUM        = 0x63,
	RAND_GETSTATE   = 0x64,
	RAND_SETSTATE   = 0x65,
	RAND_PICK       = 0x66,
	RAND_SHUFFLE    = 0x67,
	STR_NEW         = 0x68,
	STR_SPLIT       = 0x69,
	STR_REPLACE     = 0x6A,
	STR_BEGINS      = 0x6B,
	STR_ENDS        = 0x6C,
	STR_PAD         = 0x6D,
	STR_FIND        = 0x6E,
	STR_RFIND       = 0x6F,
	STR_LOWER       = 0x70,
	STR_UPPER       = 0x71,
	STR_TRIM        = 0x72,
	STR_REV         = 0x73,
	STR_REP         = 0x74,
	STR_LIST        = 0x75,
	STR_BYTE        = 0x76,
	STR_HASH        = 0x77,
	UTF8_VALID      = 0x78,
	UTF8_LIST       = 0x79,
	UTF8_STR        = 0x7A,
	STRUCT_SIZE     = 0x7B,
	STRUCT_STR      = 0x7C,
	STRUCT_LIST     = 0x7D,
	STRUCT_ISLE     = 0x7E,
	LIST_NEW        = 0x7F,
	LIST_SHIFT      = 0x80,
	LIST_POP        = 0x81,
	LIST_PUSH       = 0x82,
	LIST_UNSHIFT    = 0x83,
	LIST_APPEND     = 0x84,
	LIST_PREPEND    = 0x85,
	LIST_FIND       = 0x86,
	LIST_RFIND      = 0x87,
	LIST_JOIN       = 0x88,
	LIST_REV        = 0x89,
	LIST_STR        = 0x8A,
	LIST_SORT       = 0x8B,
	LIST_RSORT      = 0x8C,
	PICKLE_JSON     = 0x8D,
	PICKLE_BIN      = 0x8E,
	PICKLE_VAL      = 0x8F,
	PICKLE_VALID    = 0x90,
	PICKLE_SIBLING  = 0x91,
	PICKLE_CIRCULAR = 0x92,
	PICKLE_COPY     = 0x93,
	GC_GETLEVEL     = 0x94,
	GC_SETLEVEL     = 0x95,
	GC_RUN          = 0x96,
	// RESERVED     = 0xFD,
	// fake ops
	GT              = 0x1F0,
	GTE             = 0x1F1,
	PICK            = 0x1F2,
	EMBED           = 0x1F3,
	INVALID         = 0x1F4
}

enum op_pcat {
	INVALID,
	STR,
	CMDHEAD,
	CMDTAIL,
	JUMP,
	VJUMP,
	CALL,
	NATIVE,
	RETURNTAIL,
	VVVV,
	VVV,
	VV,
	V,
	EMPTY,
	VA,
	VN,
	VNN,
	VNNNN,
	VNNNNNNNN
}

function op_paramcat(op: op_enum): op_pcat {
	switch (op){
		case op_enum.NOP            : return op_pcat.EMPTY;
		case op_enum.MOVE           : return op_pcat.VV;
		case op_enum.INC            : return op_pcat.V;
		case op_enum.NIL            : return op_pcat.V;
		case op_enum.NUMP8          : return op_pcat.VN;
		case op_enum.NUMN8          : return op_pcat.VN;
		case op_enum.NUMP16         : return op_pcat.VNN;
		case op_enum.NUMN16         : return op_pcat.VNN;
		case op_enum.NUMP32         : return op_pcat.VNNNN;
		case op_enum.NUMN32         : return op_pcat.VNNNN;
		case op_enum.NUMDBL         : return op_pcat.VNNNNNNNN;
		case op_enum.STR            : return op_pcat.STR;
		case op_enum.LIST           : return op_pcat.VN;
		case op_enum.ISNUM          : return op_pcat.VV;
		case op_enum.ISSTR          : return op_pcat.VV;
		case op_enum.ISLIST         : return op_pcat.VV;
		case op_enum.NOT            : return op_pcat.VV;
		case op_enum.SIZE           : return op_pcat.VV;
		case op_enum.TONUM          : return op_pcat.VV;
		case op_enum.CAT            : return op_pcat.VA;
		case op_enum.LT             : return op_pcat.VVV;
		case op_enum.LTE            : return op_pcat.VVV;
		case op_enum.NEQ            : return op_pcat.VVV;
		case op_enum.EQU            : return op_pcat.VVV;
		case op_enum.GETAT          : return op_pcat.VVV;
		case op_enum.SLICE          : return op_pcat.VVVV;
		case op_enum.SETAT          : return op_pcat.VVV;
		case op_enum.SPLICE         : return op_pcat.VVVV;
		case op_enum.JUMP           : return op_pcat.JUMP;
		case op_enum.JUMPTRUE       : return op_pcat.VJUMP;
		case op_enum.JUMPFALSE      : return op_pcat.VJUMP;
		case op_enum.CMDHEAD        : return op_pcat.CMDHEAD;
		case op_enum.CMDTAIL        : return op_pcat.CMDTAIL;
		case op_enum.CALL           : return op_pcat.CALL;
		case op_enum.NATIVE         : return op_pcat.NATIVE;
		case op_enum.RETURN         : return op_pcat.V;
		case op_enum.RETURNTAIL     : return op_pcat.RETURNTAIL;
		case op_enum.RANGE          : return op_pcat.VVVV;
		case op_enum.ORDER          : return op_pcat.VVV;
		case op_enum.SAY            : return op_pcat.VA;
		case op_enum.WARN           : return op_pcat.VA;
		case op_enum.ASK            : return op_pcat.VA;
		case op_enum.EXIT           : return op_pcat.VA;
		case op_enum.ABORT          : return op_pcat.VA;
		case op_enum.STACKTRACE     : return op_pcat.V;
		case op_enum.NUM_NEG        : return op_pcat.VV;
		case op_enum.NUM_ADD        : return op_pcat.VVV;
		case op_enum.NUM_SUB        : return op_pcat.VVV;
		case op_enum.NUM_MUL        : return op_pcat.VVV;
		case op_enum.NUM_DIV        : return op_pcat.VVV;
		case op_enum.NUM_MOD        : return op_pcat.VVV;
		case op_enum.NUM_POW        : return op_pcat.VVV;
		case op_enum.NUM_ABS        : return op_pcat.VV;
		case op_enum.NUM_SIGN       : return op_pcat.VV;
		case op_enum.NUM_MAX        : return op_pcat.VA;
		case op_enum.NUM_MIN        : return op_pcat.VA;
		case op_enum.NUM_CLAMP      : return op_pcat.VVVV;
		case op_enum.NUM_FLOOR      : return op_pcat.VV;
		case op_enum.NUM_CEIL       : return op_pcat.VV;
		case op_enum.NUM_ROUND      : return op_pcat.VV;
		case op_enum.NUM_TRUNC      : return op_pcat.VV;
		case op_enum.NUM_NAN        : return op_pcat.V;
		case op_enum.NUM_INF        : return op_pcat.V;
		case op_enum.NUM_ISNAN      : return op_pcat.VV;
		case op_enum.NUM_ISFINITE   : return op_pcat.VV;
		case op_enum.NUM_SIN        : return op_pcat.VV;
		case op_enum.NUM_COS        : return op_pcat.VV;
		case op_enum.NUM_TAN        : return op_pcat.VV;
		case op_enum.NUM_ASIN       : return op_pcat.VV;
		case op_enum.NUM_ACOS       : return op_pcat.VV;
		case op_enum.NUM_ATAN       : return op_pcat.VV;
		case op_enum.NUM_ATAN2      : return op_pcat.VVV;
		case op_enum.NUM_LOG        : return op_pcat.VV;
		case op_enum.NUM_LOG2       : return op_pcat.VV;
		case op_enum.NUM_LOG10      : return op_pcat.VV;
		case op_enum.NUM_EXP        : return op_pcat.VV;
		case op_enum.NUM_LERP       : return op_pcat.VVVV;
		case op_enum.NUM_HEX        : return op_pcat.VVV;
		case op_enum.NUM_OCT        : return op_pcat.VVV;
		case op_enum.NUM_BIN        : return op_pcat.VVV;
		case op_enum.INT_NEW        : return op_pcat.VV;
		case op_enum.INT_NOT        : return op_pcat.VV;
		case op_enum.INT_AND        : return op_pcat.VA;
		case op_enum.INT_OR         : return op_pcat.VA;
		case op_enum.INT_XOR        : return op_pcat.VA;
		case op_enum.INT_SHL        : return op_pcat.VVV;
		case op_enum.INT_SHR        : return op_pcat.VVV;
		case op_enum.INT_SAR        : return op_pcat.VVV;
		case op_enum.INT_ADD        : return op_pcat.VVV;
		case op_enum.INT_SUB        : return op_pcat.VVV;
		case op_enum.INT_MUL        : return op_pcat.VVV;
		case op_enum.INT_DIV        : return op_pcat.VVV;
		case op_enum.INT_MOD        : return op_pcat.VVV;
		case op_enum.INT_CLZ        : return op_pcat.VV;
		case op_enum.INT_POP        : return op_pcat.VV;
		case op_enum.INT_BSWAP      : return op_pcat.VV;
		case op_enum.RAND_SEED      : return op_pcat.VV;
		case op_enum.RAND_SEEDAUTO  : return op_pcat.V;
		case op_enum.RAND_INT       : return op_pcat.V;
		case op_enum.RAND_NUM       : return op_pcat.V;
		case op_enum.RAND_GETSTATE  : return op_pcat.V;
		case op_enum.RAND_SETSTATE  : return op_pcat.VV;
		case op_enum.RAND_PICK      : return op_pcat.VV;
		case op_enum.RAND_SHUFFLE   : return op_pcat.VV;
		case op_enum.STR_NEW        : return op_pcat.VA;
		case op_enum.STR_SPLIT      : return op_pcat.VVV;
		case op_enum.STR_REPLACE    : return op_pcat.VVVV;
		case op_enum.STR_BEGINS     : return op_pcat.VVV;
		case op_enum.STR_ENDS       : return op_pcat.VVV;
		case op_enum.STR_PAD        : return op_pcat.VVV;
		case op_enum.STR_FIND       : return op_pcat.VVVV;
		case op_enum.STR_RFIND      : return op_pcat.VVVV;
		case op_enum.STR_LOWER      : return op_pcat.VV;
		case op_enum.STR_UPPER      : return op_pcat.VV;
		case op_enum.STR_TRIM       : return op_pcat.VV;
		case op_enum.STR_REV        : return op_pcat.VV;
		case op_enum.STR_REP        : return op_pcat.VVV;
		case op_enum.STR_LIST       : return op_pcat.VV;
		case op_enum.STR_BYTE       : return op_pcat.VVV;
		case op_enum.STR_HASH       : return op_pcat.VVV;
		case op_enum.UTF8_VALID     : return op_pcat.VV;
		case op_enum.UTF8_LIST      : return op_pcat.VV;
		case op_enum.UTF8_STR       : return op_pcat.VV;
		case op_enum.STRUCT_SIZE    : return op_pcat.VV;
		case op_enum.STRUCT_STR     : return op_pcat.VVV;
		case op_enum.STRUCT_LIST    : return op_pcat.VVV;
		case op_enum.STRUCT_ISLE    : return op_pcat.V;
		case op_enum.LIST_NEW       : return op_pcat.VVV;
		case op_enum.LIST_SHIFT     : return op_pcat.VV;
		case op_enum.LIST_POP       : return op_pcat.VV;
		case op_enum.LIST_PUSH      : return op_pcat.VVV;
		case op_enum.LIST_UNSHIFT   : return op_pcat.VVV;
		case op_enum.LIST_APPEND    : return op_pcat.VVV;
		case op_enum.LIST_PREPEND   : return op_pcat.VVV;
		case op_enum.LIST_FIND      : return op_pcat.VVVV;
		case op_enum.LIST_RFIND     : return op_pcat.VVVV;
		case op_enum.LIST_JOIN      : return op_pcat.VVV;
		case op_enum.LIST_REV       : return op_pcat.VV;
		case op_enum.LIST_STR       : return op_pcat.VV;
		case op_enum.LIST_SORT      : return op_pcat.VV;
		case op_enum.LIST_RSORT     : return op_pcat.VV;
		case op_enum.PICKLE_JSON    : return op_pcat.VV;
		case op_enum.PICKLE_BIN     : return op_pcat.VV;
		case op_enum.PICKLE_VAL     : return op_pcat.VV;
		case op_enum.PICKLE_VALID   : return op_pcat.VV;
		case op_enum.PICKLE_SIBLING : return op_pcat.VV;
		case op_enum.PICKLE_CIRCULAR: return op_pcat.VV;
		case op_enum.PICKLE_COPY    : return op_pcat.VV;
		case op_enum.GC_GETLEVEL    : return op_pcat.V;
		case op_enum.GC_SETLEVEL    : return op_pcat.VV;
		case op_enum.GC_RUN         : return op_pcat.V;
		case op_enum.GT             : return op_pcat.INVALID;
		case op_enum.GTE            : return op_pcat.INVALID;
		case op_enum.PICK           : return op_pcat.INVALID;
		case op_enum.EMBED          : return op_pcat.INVALID;
		case op_enum.INVALID        : return op_pcat.INVALID;
	}
	return op_pcat.INVALID;
}

function op_move(b: number[], tgt: varloc_st, src: varloc_st): void {
	if (tgt.frame === src.frame && tgt.index === src.index)
		return;
	b.push(op_enum.MOVE, tgt.frame, tgt.index, src.frame, src.index);
}

function op_inc(b: number[], src: varloc_st): void {
	b.push(op_enum.INC, src.frame, src.index);
}

function op_nil(b: number[], tgt: varloc_st): void {
	b.push(op_enum.NIL, tgt.frame, tgt.index);
}

function op_numint(b: number[], tgt: varloc_st, num: number): void {
	if (num < 0){
		if (num >= -256){
			num += 256;
			b.push(op_enum.NUMN8, tgt.frame, tgt.index, num & 0xFF);
		}
		else if (num >= -65536){
			num += 65536;
			b.push(op_enum.NUMN16, tgt.frame, tgt.index, num & 0xFF, num >> 8);
		}
		else{
			num += 4294967296;
			b.push(op_enum.NUMN32, tgt.frame, tgt.index,
				num & 0xFF, (num >> 8) & 0xFF, (num >> 16) & 0xFF, (num >> 24) & 0xFF);
		}
	}
	else{
		if (num < 256){
			b.push(op_enum.NUMP8, tgt.frame, tgt.index, num & 0xFF);
		}
		else if (num < 65536){
			b.push(op_enum.NUMP16, tgt.frame, tgt.index, num & 0xFF, num >> 8);
		}
		else{
			b.push(op_enum.NUMP32, tgt.frame, tgt.index,
				num & 0xFF, (num >> 8) & 0xFF, (num >> 16) & 0xFF, (num >> 24) & 0xFF);
		}
	}
}

let dview = new DataView(new ArrayBuffer(8));
function op_numdbl(b: number[], tgt: varloc_st, num: number): void {
	dview.setFloat64(0, num, true);
	b.push(op_enum.NUMDBL, tgt.frame, tgt.index,
		dview.getUint8(0), dview.getUint8(1), dview.getUint8(2), dview.getUint8(3),
		dview.getUint8(4), dview.getUint8(5), dview.getUint8(6), dview.getUint8(7));
}

function op_num(b: number[], tgt: varloc_st, num: number): void {
	if (Math.floor(num) === num && num >= -4294967296 && num < 4294967296)
		op_numint(b, tgt, num);
	else
		op_numdbl(b, tgt, num);
}

function op_str(b: number[], tgt: varloc_st, index: number): void {
	b.push(op_enum.STR, tgt.frame, tgt.index,
		index % 256, (index >> 8) % 256, (index >> 16) % 256, (index >> 24) % 256);
}

function op_list(b: number[], tgt: varloc_st, hint: number): void {
	if (hint > 255)
		hint = 255;
	b.push(op_enum.LIST, tgt.frame, tgt.index, hint);
}

function op_unop(b: number[], opcode: op_enum, tgt: varloc_st, src: varloc_st): void {
	b.push(opcode, tgt.frame, tgt.index, src.frame, src.index);
}

function op_cat(b: number[], tgt: varloc_st, argcount: number): void {
	b.push(op_enum.CAT, tgt.frame, tgt.index, argcount);
}

function op_arg(b: number[], arg: varloc_st): void {
	b.push(arg.frame, arg.index);
}

function op_binop(b: number[], opcode: op_enum, tgt: varloc_st, src1: varloc_st,
	src2: varloc_st): void {
	if (opcode === op_enum.CAT){
		op_cat(b, tgt, 2);
		op_arg(b, src1);
		op_arg(b, src2);
		return;
	}

	if (opcode === op_enum.GT || opcode === op_enum.GTE){
		opcode = opcode === op_enum.GT ? op_enum.LT : op_enum.LTE;
		let t = src1;
		src1 = src2;
		src2 = t;
	}

	b.push(opcode, tgt.frame, tgt.index, src1.frame, src1.index, src2.frame, src2.index);
}

function op_getat(b: number[], tgt: varloc_st, src1: varloc_st, src2: varloc_st): void {
	b.push(op_enum.GETAT, tgt.frame, tgt.index, src1.frame, src1.index, src2.frame, src2.index);
}

function op_slice(b: number[], tgt: varloc_st, src1: varloc_st, src2: varloc_st, src3: varloc_st):
	void {
	b.push(op_enum.SLICE, tgt.frame, tgt.index, src1.frame, src1.index, src2.frame, src2.index,
		src3.frame, src3.index);
}

function op_setat(b: number[], src1: varloc_st, src2: varloc_st, src3: varloc_st): void {
	b.push(op_enum.SETAT, src1.frame, src1.index, src2.frame, src2.index, src3.frame, src3.index);
}

function op_splice(b: number[], src1: varloc_st, src2: varloc_st, src3: varloc_st, src4: varloc_st):
	void {
	b.push(op_enum.SPLICE, src1.frame, src1.index, src2.frame, src2.index, src3.frame, src3.index,
		src4.frame, src4.index);
}

function op_jump(b: number[], index: number, hint: string): void {
	b.push(op_enum.JUMP, index % 256, (index >> 8) % 256, (index >> 16) % 256, (index >> 24) % 256);
}

function op_jumptrue(b: number[], src: varloc_st, index: number, hint: string): void {
	b.push(op_enum.JUMPTRUE, src.frame, src.index,
		index % 256, (index >> 8) % 256, (index >> 16) % 256, (index >> 24) % 256);
}

function op_jumpfalse(b: number[], src: varloc_st, index: number, hint: string): void {
	b.push(op_enum.JUMPFALSE, src.frame, src.index,
		index % 256, (index >> 8) % 256, (index >> 16) % 256, (index >> 24) % 256);
}

function op_cmdhead(b: number[], level: number, restpos: number): void {
	b.push(op_enum.CMDHEAD, level, restpos);
}

function op_cmdtail(b: number[]): void {
	b.push(op_enum.CMDTAIL);
}

function op_call(b: number[], ret: varloc_st, index: number, argcount: number, hint: string): void {
	b.push(op_enum.CALL, ret.frame, ret.index,
		index % 256, (index >> 8) % 256, (index >> 16) % 256, (index >> 24) % 256, argcount);
}

function op_native(b: number[], ret: varloc_st, index: number, argcount: number): void {
	b.push(op_enum.NATIVE, ret.frame, ret.index,
		index % 256, (index >> 8) % 256, (index >> 16) % 256, (index >> 24) % 256, argcount);
}

function op_return(b: number[], src: varloc_st): void {
	b.push(op_enum.RETURN, src.frame, src.index);
}

function op_returntail(b: number[], index: number, argcount: number, hint: string): void {
	b.push(op_enum.RETURNTAIL,
		index % 256, (index >> 8) % 256, (index >> 16) % 256, (index >> 24) % 256, argcount);
}

function op_parama(b: number[], opcode: op_enum, tgt: varloc_st, argcount: number): void {
	b.push(opcode, tgt.frame, tgt.index, argcount);
}

function op_param0(b: number[], opcode: op_enum, tgt: varloc_st): void {
	b.push(opcode, tgt.frame, tgt.index);
}

function op_param1(b: number[], opcode: op_enum, tgt: varloc_st, src: varloc_st): void {
	b.push(opcode, tgt.frame, tgt.index, src.frame, src.index);
}

function op_param2(b: number[], opcode: op_enum, tgt: varloc_st, src1: varloc_st,
	src2: varloc_st): void {
	b.push(opcode, tgt.frame, tgt.index, src1.frame, src1.index, src2.frame, src2.index);
}

function op_param3(b: number[], opcode: op_enum, tgt: varloc_st, src1: varloc_st, src2: varloc_st,
	src3: varloc_st): void {
	b.push(opcode, tgt.frame, tgt.index, src1.frame, src1.index, src2.frame, src2.index,
		src3.frame, src3.index);
}

enum ks_enum {
	INVALID,
	PLUS,
	UNPLUS,
	MINUS,
	UNMINUS,
	PERCENT,
	STAR,
	SLASH,
	CARET,
	AMP,
	LT,
	GT,
	BANG,
	EQU,
	TILDE,
	COLON,
	COMMA,
	PERIOD,
	PIPE,
	LPAREN,
	LBRACKET,
	LBRACE,
	RPAREN,
	RBRACKET,
	RBRACE,
	PLUSEQU,
	MINUSEQU,
	PERCENTEQU,
	STAREQU,
	SLASHEQU,
	CARETEQU,
	LTEQU,
	GTEQU,
	BANGEQU,
	EQU2,
	TILDEEQU,
	AMP2,
	PIPE2,
	PERIOD3,
	PIPE2EQU,
	AMP2EQU,
	BREAK,
	CONTINUE,
	DECLARE,
	DEF,
	DO,
	ELSE,
	ELSEIF,
	END,
	ENUM,
	FOR,
	GOTO,
	IF,
	INCLUDE,
	NAMESPACE,
	NIL,
	RETURN,
	USING,
	VAR,
	WHILE
}

function ks_char(c: string): ks_enum{
	if      (c === '+') return ks_enum.PLUS;
	else if (c === '-') return ks_enum.MINUS;
	else if (c === '%') return ks_enum.PERCENT;
	else if (c === '*') return ks_enum.STAR;
	else if (c === '/') return ks_enum.SLASH;
	else if (c === '^') return ks_enum.CARET;
	else if (c === '&') return ks_enum.AMP;
	else if (c === '<') return ks_enum.LT;
	else if (c === '>') return ks_enum.GT;
	else if (c === '!') return ks_enum.BANG;
	else if (c === '=') return ks_enum.EQU;
	else if (c === '~') return ks_enum.TILDE;
	else if (c === ':') return ks_enum.COLON;
	else if (c === ',') return ks_enum.COMMA;
	else if (c === '.') return ks_enum.PERIOD;
	else if (c === '|') return ks_enum.PIPE;
	else if (c === '(') return ks_enum.LPAREN;
	else if (c === '[') return ks_enum.LBRACKET;
	else if (c === '{') return ks_enum.LBRACE;
	else if (c === ')') return ks_enum.RPAREN;
	else if (c === ']') return ks_enum.RBRACKET;
	else if (c === '}') return ks_enum.RBRACE;
	return ks_enum.INVALID;
}

function ks_char2(c1: string, c2: string): ks_enum{
	if      (c1 === '+' && c2 === '=') return ks_enum.PLUSEQU;
	else if (c1 === '-' && c2 === '=') return ks_enum.MINUSEQU;
	else if (c1 === '%' && c2 === '=') return ks_enum.PERCENTEQU;
	else if (c1 === '*' && c2 === '=') return ks_enum.STAREQU;
	else if (c1 === '/' && c2 === '=') return ks_enum.SLASHEQU;
	else if (c1 === '^' && c2 === '=') return ks_enum.CARETEQU;
	else if (c1 === '<' && c2 === '=') return ks_enum.LTEQU;
	else if (c1 === '>' && c2 === '=') return ks_enum.GTEQU;
	else if (c1 === '!' && c2 === '=') return ks_enum.BANGEQU;
	else if (c1 === '=' && c2 === '=') return ks_enum.EQU2;
	else if (c1 === '~' && c2 === '=') return ks_enum.TILDEEQU;
	else if (c1 === '&' && c2 === '&') return ks_enum.AMP2;
	else if (c1 === '|' && c2 === '|') return ks_enum.PIPE2;
	return ks_enum.INVALID;
}

function ks_char3(c1: string, c2: string, c3: string): ks_enum {
	if      (c1 === '.' && c2 === '.' && c3 === '.') return ks_enum.PERIOD3;
	else if (c1 === '|' && c2 === '|' && c3 === '=') return ks_enum.PIPE2EQU;
	else if (c1 === '&' && c2 === '&' && c3 === '=') return ks_enum.AMP2EQU;
	return ks_enum.INVALID;
}

function ks_str(s: string): ks_enum {
	if      (s === 'break'    ) return ks_enum.BREAK;
	else if (s === 'continue' ) return ks_enum.CONTINUE;
	else if (s === 'declare'  ) return ks_enum.DECLARE;
	else if (s === 'def'      ) return ks_enum.DEF;
	else if (s === 'do'       ) return ks_enum.DO;
	else if (s === 'else'     ) return ks_enum.ELSE;
	else if (s === 'elseif'   ) return ks_enum.ELSEIF;
	else if (s === 'end'      ) return ks_enum.END;
	else if (s === 'enum'     ) return ks_enum.ENUM;
	else if (s === 'for'      ) return ks_enum.FOR;
	else if (s === 'goto'     ) return ks_enum.GOTO;
	else if (s === 'if'       ) return ks_enum.IF;
	else if (s === 'include'  ) return ks_enum.INCLUDE;
	else if (s === 'namespace') return ks_enum.NAMESPACE;
	else if (s === 'nil'      ) return ks_enum.NIL;
	else if (s === 'return'   ) return ks_enum.RETURN;
	else if (s === 'using'    ) return ks_enum.USING;
	else if (s === 'var'      ) return ks_enum.VAR;
	else if (s === 'while'    ) return ks_enum.WHILE;
	return ks_enum.INVALID;
}

function ks_toUnaryOp(k: ks_enum): op_enum {
	if      (k === ks_enum.PLUS   ) return op_enum.TONUM;
	else if (k === ks_enum.UNPLUS ) return op_enum.TONUM;
	else if (k === ks_enum.MINUS  ) return op_enum.NUM_NEG;
	else if (k === ks_enum.UNMINUS) return op_enum.NUM_NEG;
	else if (k === ks_enum.AMP    ) return op_enum.SIZE;
	else if (k === ks_enum.BANG   ) return op_enum.NOT;
	return op_enum.INVALID;
}

function ks_toBinaryOp(k: ks_enum): op_enum {
	if      (k === ks_enum.PLUS   ) return op_enum.NUM_ADD;
	else if (k === ks_enum.MINUS  ) return op_enum.NUM_SUB;
	else if (k === ks_enum.PERCENT) return op_enum.NUM_MOD;
	else if (k === ks_enum.STAR   ) return op_enum.NUM_MUL;
	else if (k === ks_enum.SLASH  ) return op_enum.NUM_DIV;
	else if (k === ks_enum.CARET  ) return op_enum.NUM_POW;
	else if (k === ks_enum.LT     ) return op_enum.LT;
	else if (k === ks_enum.GT     ) return op_enum.GT;
	else if (k === ks_enum.TILDE  ) return op_enum.CAT;
	else if (k === ks_enum.LTEQU  ) return op_enum.LTE;
	else if (k === ks_enum.GTEQU  ) return op_enum.GTE;
	else if (k === ks_enum.BANGEQU) return op_enum.NEQ;
	else if (k === ks_enum.EQU2   ) return op_enum.EQU;
	return op_enum.INVALID;
}

function ks_toMutateOp(k: ks_enum): op_enum {
	if      (k === ks_enum.PLUSEQU   ) return op_enum.NUM_ADD;
	else if (k === ks_enum.PERCENTEQU) return op_enum.NUM_MOD;
	else if (k === ks_enum.MINUSEQU  ) return op_enum.NUM_SUB;
	else if (k === ks_enum.STAREQU   ) return op_enum.NUM_MUL;
	else if (k === ks_enum.SLASHEQU  ) return op_enum.NUM_DIV;
	else if (k === ks_enum.CARETEQU  ) return op_enum.NUM_POW;
	else if (k === ks_enum.TILDEEQU  ) return op_enum.CAT;
	return op_enum.INVALID;
}

interface filepos_st {
	fullfile: number;
	basefile: number;
	line: number;
	chr: number;
}

const FILEPOS_NULL: filepos_st = { basefile: -1, fullfile: -1, line: -1, chr: -1 };

enum tok_enum {
	NEWLINE,
	KS,
	IDENT,
	NUM,
	STR,
	ERROR
}

interface tok_st_NEWLINE {
	type: tok_enum.NEWLINE;
	flp: filepos_st;
	soft: boolean;
}
interface tok_st_KS {
	type: tok_enum.KS;
	flp: filepos_st;
	k: ks_enum;
}
interface tok_st_IDENT {
	type: tok_enum.IDENT;
	flp: filepos_st;
	ident: string;
}
interface tok_st_NUM {
	type: tok_enum.NUM;
	flp: filepos_st;
	num: number;
}
interface tok_st_STR {
	type: tok_enum.STR;
	flp: filepos_st;
	str: string;
}
interface tok_st_ERROR {
	type: tok_enum.ERROR;
	flp: filepos_st;
	msg: string;
}
type tok_st = tok_st_NEWLINE | tok_st_KS | tok_st_IDENT | tok_st_NUM | tok_st_STR | tok_st_ERROR;

function tok_newline(flp: filepos_st, soft: boolean): tok_st {
	return {
		type: tok_enum.NEWLINE,
		flp: flp,
		soft: soft
	};
}

function tok_ks(flp: filepos_st, k: ks_enum): tok_st {
	return {
		type: tok_enum.KS,
		flp: flp,
		k: k
	};
}

function tok_ident(flp: filepos_st, ident: string): tok_st {
	return {
		type: tok_enum.IDENT,
		flp: flp,
		ident: ident
	};
}

function tok_num(flp: filepos_st, num: number): tok_st {
	return {
		type: tok_enum.NUM,
		flp: flp,
		num: num
	};
}

function tok_str(flp: filepos_st, str: string): tok_st {
	return {
		type: tok_enum.STR,
		flp: flp,
		str: str
	};
}

function tok_error(flp: filepos_st, msg: string): tok_st {
	return {
		type: tok_enum.ERROR,
		flp: flp,
		msg: msg
	};
}

function tok_isKS(tk: tok_st, k: ks_enum): boolean {
	return tk.type === tok_enum.KS && tk.k === k;
}

function tok_isMidStmt(tk: tok_st): boolean {
	return tk.type === tok_enum.KS && (tk.k === ks_enum.END || tk.k === ks_enum.ELSE ||
		tk.k === ks_enum.ELSEIF || tk.k === ks_enum.WHILE);
}

function tok_isPre(tk: tok_st): boolean {
	if (tk.type !== tok_enum.KS)
		return false;
	let k = tk.k;
	return false ||
		k === ks_enum.PLUS    ||
		k === ks_enum.UNPLUS  ||
		k === ks_enum.MINUS   ||
		k === ks_enum.UNMINUS ||
		k === ks_enum.AMP     ||
		k === ks_enum.BANG    ||
		k === ks_enum.PERIOD3;
}

function tok_isMid(tk: tok_st, allowComma: boolean, allowPipe: boolean): boolean {
	if (tk.type !== tok_enum.KS)
		return false;
	let k = tk.k;
	return false ||
		k === ks_enum.PLUS       ||
		k === ks_enum.PLUSEQU    ||
		k === ks_enum.MINUS      ||
		k === ks_enum.MINUSEQU   ||
		k === ks_enum.PERCENT    ||
		k === ks_enum.PERCENTEQU ||
		k === ks_enum.STAR       ||
		k === ks_enum.STAREQU    ||
		k === ks_enum.SLASH      ||
		k === ks_enum.SLASHEQU   ||
		k === ks_enum.CARET      ||
		k === ks_enum.CARETEQU   ||
		k === ks_enum.LT         ||
		k === ks_enum.LTEQU      ||
		k === ks_enum.GT         ||
		k === ks_enum.GTEQU      ||
		k === ks_enum.BANGEQU    ||
		k === ks_enum.EQU        ||
		k === ks_enum.EQU2       ||
		k === ks_enum.TILDE      ||
		k === ks_enum.TILDEEQU   ||
		k === ks_enum.AMP2       ||
		k === ks_enum.PIPE2      ||
		k === ks_enum.AMP2EQU    ||
		k === ks_enum.PIPE2EQU   ||
		(allowComma && k === ks_enum.COMMA) ||
		(allowPipe  && k === ks_enum.PIPE );
}

function tok_isTerm(tk: tok_st): boolean {
	return false ||
		(tk.type === tok_enum.KS &&
			(tk.k === ks_enum.NIL || tk.k === ks_enum.LPAREN || tk.k === ks_enum.LBRACE)) ||
		tk.type === tok_enum.IDENT ||
		tk.type === tok_enum.NUM   ||
		tk.type === tok_enum.STR;
}

function tok_isPreBeforeMid(pre: tok_st_KS, mid: tok_st_KS): boolean {
	if ((pre.k === ks_enum.MINUS || pre.k === ks_enum.UNMINUS) && mid.k === ks_enum.CARET)
		return false;
	return true;
}

function tok_midPrecedence(tk: tok_st_KS): number {
	let k = tk.k;
	if      (k === ks_enum.CARET     ) return  1;
	else if (k === ks_enum.STAR      ) return  2;
	else if (k === ks_enum.SLASH     ) return  2;
	else if (k === ks_enum.PERCENT   ) return  2;
	else if (k === ks_enum.PLUS      ) return  3;
	else if (k === ks_enum.MINUS     ) return  3;
	else if (k === ks_enum.TILDE     ) return  4;
	else if (k === ks_enum.LTEQU     ) return  5;
	else if (k === ks_enum.LT        ) return  5;
	else if (k === ks_enum.GTEQU     ) return  5;
	else if (k === ks_enum.GT        ) return  5;
	else if (k === ks_enum.BANGEQU   ) return  6;
	else if (k === ks_enum.EQU2      ) return  6;
	else if (k === ks_enum.AMP2      ) return  7;
	else if (k === ks_enum.PIPE2     ) return  8;
	else if (k === ks_enum.COMMA     ) return  9;
	else if (k === ks_enum.PIPE      ) return 10;
	else if (k === ks_enum.EQU       ) return 20;
	else if (k === ks_enum.PLUSEQU   ) return 20;
	else if (k === ks_enum.PERCENTEQU) return 20;
	else if (k === ks_enum.MINUSEQU  ) return 20;
	else if (k === ks_enum.STAREQU   ) return 20;
	else if (k === ks_enum.SLASHEQU  ) return 20;
	else if (k === ks_enum.CARETEQU  ) return 20;
	else if (k === ks_enum.TILDEEQU  ) return 20;
	else if (k === ks_enum.AMP2EQU   ) return 20;
	else if (k === ks_enum.PIPE2EQU  ) return 20;
	throw new Error('Assertion failed');
}

function tok_isMidBeforeMid(lmid: tok_st_KS, rmid: tok_st_KS): boolean {
	let lp = tok_midPrecedence(lmid);
	let rp = tok_midPrecedence(rmid);
	if (lp < rp)
		return true;
	else if (lp > rp)
		return false;
	if (lp === 20 || lp === 1)
		return false;
	return true;
}

function isSpace(c: string): boolean {
	return c === ' ' || c === '\n' || c === '\r' || c === '\t';
}

function isAlpha(c: string): boolean {
	return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

function isNum(c: string): boolean {
	return c >= '0' && c <= '9';
}

function isIdentStart(c: string): boolean {
	return isAlpha(c) || c === '_';
}

function isIdentBody(c: string): boolean {
	return isIdentStart(c) || isNum(c);
}

function isHex(c: string): boolean {
	return isNum(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
}

function toHex(c: string): number {
	if (isNum(c))
		return c.charCodeAt(0) - 48;
	else if (c >= 'a')
		return c.charCodeAt(0) - 87;
	return c.charCodeAt(0) - 55;
}

function toNibble(n: number): string {
	return n.toString(16).toUpperCase();
}

enum lex_enum {
	START,
	COMMENT_LINE,
	BACKSLASH,
	RETURN,
	COMMENT_BLOCK,
	SPECIAL1,
	SPECIAL2,
	IDENT,
	NUM_0,
	NUM_2,
	NUM_BODY,
	NUM_FRAC,
	NUM_EXP,
	NUM_EXP_BODY,
	STR_BASIC,
	STR_BASIC_ESC,
	STR_INTERP,
	STR_INTERP_DLR,
	STR_INTERP_DLR_ID,
	STR_INTERP_ESC,
	STR_INTERP_ESC_HEX
}

interface numpart_info {
	sign: number;
	val: number;
	base: number;
	frac: number;
	flen: number;
	esign: number;
	eval: number;
}

function numpart_new(info?: numpart_info): numpart_info {
	if (info){
		info.sign  = 1;
		info.val   = 0;
		info.base  = 10;
		info.frac  = 0;
		info.flen  = 0;
		info.esign = 1;
		info.eval  = 0;
	}
	else{
		info = {
			sign : 1,
			val  : 0,
			base : 10,
			frac : 0,
			flen : 0,
			esign: 1,
			eval : 0
		};
	}
	return info;
}

function numpart_calc(info: numpart_info): number {
	let val = info.val;
	let e = 1;
	if (info.eval > 0){
		e = Math.pow(info.base === 10 ? 10.0 : 2.0, info.esign * info.eval);
		val *= e;
	}
	if (info.flen > 0){
		let d = Math.pow(info.base, info.flen);
		val = (val * d + info.frac * e) / d;
	}
	return info.sign * val;
}

interface lex_st {
	str: string;
	braces: number[];
	state: lex_enum;
	npi: numpart_info;
	flpS: filepos_st;
	flpR: filepos_st;
	flp1: filepos_st;
	flp2: filepos_st;
	flp3: filepos_st;
	flp4: filepos_st;
	chR: string;
	ch1: string;
	ch2: string;
	ch3: string;
	ch4: string;
	str_hexval: number;
	str_hexleft: number;
	numexp: boolean;
}

function lex_reset(lx: lex_st): void {
	lx.state = lex_enum.START;
	lx.flpS = lx.flpR = lx.flp1 = lx.flp2 = lx.flp3 = lx.flp4 = FILEPOS_NULL;
	lx.chR = lx.ch1 = lx.ch2 = lx.ch3 = lx.ch4 = '';
	lx.str = '';
	lx.braces = [0];
	lx.str_hexval = 0;
	lx.str_hexleft = 0;
}

function lex_new(): lex_st {
	return {
		str: '',
		braces: [0],
		state: lex_enum.START,
		npi: numpart_new(),
		flpS: FILEPOS_NULL,
		flpR: FILEPOS_NULL,
		flp1: FILEPOS_NULL,
		flp2: FILEPOS_NULL,
		flp3: FILEPOS_NULL,
		flp4: FILEPOS_NULL,
		chR: '',
		ch1: '',
		ch2: '',
		ch3: '',
		ch4: '',
		str_hexval: 0,
		str_hexleft: 0,
		numexp: false
	};
}

function lex_fwd(lx: lex_st, flp: filepos_st, ch: string): void {
	lx.ch4 = lx.ch3;
	lx.ch3 = lx.ch2;
	lx.ch2 = lx.ch1;
	lx.ch1 = ch;
	lx.flp4 = lx.flp3;
	lx.flp3 = lx.flp2;
	lx.flp2 = lx.flp1;
	lx.flp1 = flp;
}

function lex_rev(lx: lex_st): void {
	lx.chR = lx.ch1;
	lx.ch1 = lx.ch2;
	lx.ch2 = lx.ch3;
	lx.ch3 = lx.ch4;
	lx.ch4 = '';
	lx.flpR = lx.flp1;
	lx.flp1 = lx.flp2;
	lx.flp2 = lx.flp3;
	lx.flp3 = lx.flp4;
	lx.flp4 = FILEPOS_NULL;
}

function lex_process(lx: lex_st, tks: tok_st[]): void {
	let ch1 = lx.ch1;
	let flp = lx.flp1;
	let flpS = lx.flpS;

	switch (lx.state){
		case lex_enum.START:
			lx.flpS = flp;
			if (ch1 === '#'){
				lx.state = lex_enum.COMMENT_LINE;
				tks.push(tok_newline(flp, false));
			}
			else if (ks_char(ch1) !== ks_enum.INVALID){
				if (ch1 === '{')
					lx.braces[lx.braces.length - 1]++;
				else if (ch1 === '}'){
					if (lx.braces[lx.braces.length - 1] > 0)
						lx.braces[lx.braces.length - 1]--;
					else if (lx.braces.length > 1){
						lx.braces.pop();
						lx.str = '';
						lx.state = lex_enum.STR_INTERP;
						tks.push(tok_ks(flp, ks_enum.RPAREN));
						tks.push(tok_ks(flp, ks_enum.TILDE));
						break;
					}
					else
						tks.push(tok_error(flp, 'Mismatched brace'));
				}
				lx.state = lex_enum.SPECIAL1;
			}
			else if (isIdentStart(ch1)){
				lx.str = ch1;
				lx.state = lex_enum.IDENT;
			}
			else if (isNum(ch1)){
				numpart_new(lx.npi);
				lx.npi.val = toHex(ch1);
				if (lx.npi.val === 0)
					lx.state = lex_enum.NUM_0;
				else
					lx.state = lex_enum.NUM_BODY;
			}
			else if (ch1 === '\''){
				lx.str = '';
				lx.state = lex_enum.STR_BASIC;
			}
			else if (ch1 === '"'){
				lx.str = '';
				lx.state = lex_enum.STR_INTERP;
				tks.push(tok_ks(flp, ks_enum.LPAREN));
			}
			else if (ch1 === '\\')
				lx.state = lex_enum.BACKSLASH;
			else if (ch1 === '\r'){
				lx.state = lex_enum.RETURN;
				tks.push(tok_newline(flp, false));
			}
			else if (ch1 === '\n' || ch1 === ';')
				tks.push(tok_newline(flp, ch1 === ';'));
			else if (!isSpace(ch1))
				tks.push(tok_error(flp, 'Unexpected character: ' + ch1));
			break;

		case lex_enum.COMMENT_LINE:
			if (ch1 === '\r')
				lx.state = lex_enum.RETURN;
			else if (ch1 === '\n')
				lx.state = lex_enum.START;
			break;

		case lex_enum.BACKSLASH:
			if (ch1 === '#')
				lx.state = lex_enum.COMMENT_LINE;
			else if (ch1 === '\r')
				lx.state = lex_enum.RETURN;
			else if (ch1 === '\n')
				lx.state = lex_enum.START;
			else if (!isSpace(ch1))
				tks.push(tok_error(flp, 'Invalid character after backslash'));
			break;

		case lex_enum.RETURN:
			lx.state = lex_enum.START;
			if (ch1 !== '\n')
				lex_process(lx, tks);
			break;

		case lex_enum.COMMENT_BLOCK:
			if (lx.ch2 === '*' && ch1 === '/')
				lx.state = lex_enum.START;
			break;

		case lex_enum.SPECIAL1:
			if (ks_char(ch1) !== ks_enum.INVALID){
				if (lx.ch2 === '/' && ch1 === '*')
					lx.state = lex_enum.COMMENT_BLOCK;
				else
					lx.state = lex_enum.SPECIAL2;
			}
			else{
				let ks1 = ks_char(lx.ch2);
				// hack to detect difference between binary and unary +/-
				if (ks1 === ks_enum.PLUS){
					if (!isSpace(ch1) && isSpace(lx.ch3))
						ks1 = ks_enum.UNPLUS;
				}
				else if (ks1 === ks_enum.MINUS){
					if (!isSpace(ch1) && isSpace(lx.ch3))
						ks1 = ks_enum.UNMINUS;
				}
				tks.push(tok_ks(lx.flp2, ks1));
				lx.state = lex_enum.START;
				lex_process(lx, tks);
			}
			break;

		case lex_enum.SPECIAL2: {
			let ks3 = ks_char3(lx.ch3, lx.ch2, ch1);
			if (ks3 !== ks_enum.INVALID){
				lx.state = lex_enum.START;
				tks.push(tok_ks(lx.flp3, ks3));
			}
			else{
				let ks2 = ks_char2(lx.ch3, lx.ch2);
				if (ks2 !== ks_enum.INVALID){
					tks.push(tok_ks(lx.flp3, ks2));
					lx.state = lex_enum.START;
					lex_process(lx, tks);
				}
				else{
					let ks1 = ks_char(lx.ch3);
					// hack to detect difference between binary and unary +/-
					if (ks1 === ks_enum.PLUS && isSpace(lx.ch4))
						ks1 = ks_enum.UNPLUS;
					else if (ks1 === ks_enum.MINUS && isSpace(lx.ch4))
						ks1 = ks_enum.UNMINUS;
					tks.push(tok_ks(lx.flp3, ks1));
					lx.state = lex_enum.START;
					lex_rev(lx);
					lex_process(lx, tks);
					lex_fwd(lx, lx.flpR, lx.chR);
					lex_process(lx, tks);
				}
			}
		} break;

		case lex_enum.IDENT:
			if (!isIdentBody(ch1)){
				let ksk = ks_str(lx.str);
				if (ksk !== ks_enum.INVALID)
					tks.push(tok_ks(flpS, ksk));
				else
					tks.push(tok_ident(flpS, lx.str));
				lx.state = lex_enum.START;
				lex_process(lx, tks);
			}
			else{
				lx.str += ch1;
				if (lx.str.length > 1024)
					tks.push(tok_error(flpS, 'Identifier too long'));
			}
			break;

		case lex_enum.NUM_0:
			if (ch1 === 'b'){
				lx.npi.base = 2;
				lx.state = lex_enum.NUM_2;
			}
			else if (ch1 === 'c'){
				lx.npi.base = 8;
				lx.state = lex_enum.NUM_2;
			}
			else if (ch1 === 'x'){
				lx.npi.base = 16;
				lx.state = lex_enum.NUM_2;
			}
			else if (ch1 === '_')
				lx.state = lex_enum.NUM_BODY;
			else if (ch1 === '.')
				lx.state = lex_enum.NUM_FRAC;
			else if (ch1 === 'e' || ch1 === 'E')
				lx.state = lex_enum.NUM_EXP;
			else if (!isIdentStart(ch1)){
				tks.push(tok_num(flpS, 0));
				lx.state = lex_enum.START;
				lex_process(lx, tks);
			}
			else
				tks.push(tok_error(flpS, 'Invalid number'));
			break;

		case lex_enum.NUM_2:
			if (isHex(ch1)){
				lx.npi.val = toHex(ch1);
				if (lx.npi.val >= lx.npi.base)
					tks.push(tok_error(flpS, 'Invalid number'));
				else
					lx.state = lex_enum.NUM_BODY;
			}
			else if (ch1 !== '_')
				tks.push(tok_error(flpS, 'Invalid number'));
			break;

		case lex_enum.NUM_BODY:
			if (ch1 === '.')
				lx.state = lex_enum.NUM_FRAC;
			else if ((lx.npi.base === 10 && (ch1 === 'e' || ch1 === 'E')) ||
				(lx.npi.base !== 10 && (ch1 === 'p' || ch1 === 'P')))
				lx.state = lex_enum.NUM_EXP;
			else if (isHex(ch1)){
				let v = toHex(ch1);
				if (v >= lx.npi.base)
					tks.push(tok_error(flpS, 'Invalid number'));
				else
					lx.npi.val = lx.npi.val * lx.npi.base + v;
			}
			else if (!isAlpha(ch1)){
				tks.push(tok_num(flpS, numpart_calc(lx.npi)));
				lx.state = lex_enum.START;
				lex_process(lx, tks);
			}
			else if (ch1 !== '_')
				tks.push(tok_error(flpS, 'Invalid number'));
			break;

		case lex_enum.NUM_FRAC:
			if ((lx.npi.base === 10 && (ch1 === 'e' || ch1 === 'E')) ||
				(lx.npi.base !== 10 && (ch1 === 'p' || ch1 === 'P')))
				lx.state = lex_enum.NUM_EXP;
			else if (isHex(ch1)){
				let v = toHex(ch1);
				if (v >= lx.npi.base)
					tks.push(tok_error(flpS, 'Invalid number'));
				else{
					lx.npi.frac = lx.npi.frac * lx.npi.base + v;
					lx.npi.flen++;
				}
			}
			else if (!isAlpha(ch1)){
				if (lx.npi.flen <= 0)
					tks.push(tok_error(flpS, 'Invalid number'));
				else{
					tks.push(tok_num(flpS, numpart_calc(lx.npi)));
					lx.state = lex_enum.START;
					lex_process(lx, tks);
				}
			}
			else if (ch1 !== '_')
				tks.push(tok_error(flpS, 'Invalid number'));
			break;

		case lex_enum.NUM_EXP:
			if (ch1 !== '_'){
				lx.npi.esign = ch1 === '-' ? -1 : 1;
				lx.state = lex_enum.NUM_EXP_BODY;
				lx.numexp = false;
				if (ch1 !== '+' && ch1 !== '-')
					lex_process(lx, tks);
			}
			break;

		case lex_enum.NUM_EXP_BODY:
			if (isNum(ch1)){
				lx.npi.eval = lx.npi.eval * 10.0 + toHex(ch1);
				lx.numexp = true;
			}
			else if (!isAlpha(ch1)){
				if (!lx.numexp)
					tks.push(tok_error(flpS, 'Invalid number'));
				else{
					tks.push(tok_num(flpS, numpart_calc(lx.npi)));
					lx.state = lex_enum.START;
					lex_process(lx, tks);
				}
			}
			else if (ch1 !== '_')
				tks.push(tok_error(flpS, 'Invalid number'));
			break;

		case lex_enum.STR_BASIC:
			if (ch1 === '\r' || ch1 === '\n')
				tks.push(tok_error(lx.flp2, 'Missing end of string'));
			else if (ch1 === '\'')
				lx.state = lex_enum.STR_BASIC_ESC;
			else
				lx.str += ch1;
			break;

		case lex_enum.STR_BASIC_ESC:
			if (ch1 === '\''){
				lx.str += ch1;
				lx.state = lex_enum.STR_BASIC;
			}
			else{
				lx.state = lex_enum.START;
				tks.push(tok_ks(flpS, ks_enum.LPAREN));
				tks.push(tok_str(flpS, lx.str));
				tks.push(tok_ks(lx.flp2, ks_enum.RPAREN));
				lex_process(lx, tks);
			}
			break;

		case lex_enum.STR_INTERP:
			if (ch1 === '\r' || ch1 === '\n')
				tks.push(tok_error(lx.flp2, 'Missing end of string'));
			else if (ch1 === '"'){
				lx.state = lex_enum.START;
				tks.push(tok_str(flpS, lx.str));
				tks.push(tok_ks(flp, ks_enum.RPAREN));
			}
			else if (ch1 === '$'){
				lx.state = lex_enum.STR_INTERP_DLR;
				tks.push(tok_str(flpS, lx.str));
				tks.push(tok_ks(flp, ks_enum.TILDE));
			}
			else if (ch1 === '\\')
				lx.state = lex_enum.STR_INTERP_ESC;
			else
				lx.str += ch1;
			break;

		case lex_enum.STR_INTERP_DLR:
			if (ch1 === '{'){
				lx.braces.push(0);
				lx.state = lex_enum.START;
				tks.push(tok_ks(flp, ks_enum.LPAREN));
			}
			else if (isIdentStart(ch1)){
				lx.str = ch1;
				lx.state = lex_enum.STR_INTERP_DLR_ID;
				lx.flpS = flp; // save start position of ident
			}
			else
				tks.push(tok_error(flp, 'Invalid substitution'));
			break;

		case lex_enum.STR_INTERP_DLR_ID:
			if (!isIdentBody(ch1)){
				if (ks_str(lx.str) !== ks_enum.INVALID)
					tks.push(tok_error(flpS, 'Invalid substitution'));
				else{
					tks.push(tok_ident(flpS, lx.str));
					if (ch1 === '"'){
						lx.state = lex_enum.START;
						tks.push(tok_ks(flp, ks_enum.RPAREN));
					}
					else{
						lx.str = '';
						lx.state = lex_enum.STR_INTERP;
						tks.push(tok_ks(flp, ks_enum.TILDE));
						lex_process(lx, tks);
					}
				}
			}
			else{
				lx.str += ch1;
				if (lx.str.length > 1024)
					tks.push(tok_error(flpS, 'Identifier too long'));
			}
			break;

		case lex_enum.STR_INTERP_ESC:
			if (ch1 === '\r' || ch1 === '\n')
				tks.push(tok_error(lx.flp2, 'Missing end of string'));
			else if (ch1 === 'x'){
				lx.str_hexval = 0;
				lx.str_hexleft = 2;
				lx.state = lex_enum.STR_INTERP_ESC_HEX;
			}
			else if (ch1 === '0'){
				lx.str += String.fromCharCode(0);
				lx.state = lex_enum.STR_INTERP;
			}
			else if (ch1 === 'b'){
				lx.str += String.fromCharCode(8);
				lx.state = lex_enum.STR_INTERP;
			}
			else if (ch1 === 't'){
				lx.str += String.fromCharCode(9);
				lx.state = lex_enum.STR_INTERP;
			}
			else if (ch1 === 'n'){
				lx.str += String.fromCharCode(10);
				lx.state = lex_enum.STR_INTERP;
			}
			else if (ch1 === 'v'){
				lx.str += String.fromCharCode(11);
				lx.state = lex_enum.STR_INTERP;
			}
			else if (ch1 === 'f'){
				lx.str += String.fromCharCode(12);
				lx.state = lex_enum.STR_INTERP;
			}
			else if (ch1 === 'r'){
				lx.str += String.fromCharCode(13);
				lx.state = lex_enum.STR_INTERP;
			}
			else if (ch1 === 'e'){
				lx.str += String.fromCharCode(27);
				lx.state = lex_enum.STR_INTERP;
			}
			else if (ch1 === '\\' || ch1 === '\'' || ch1 === '"' || ch1 === '$'){
				lx.str += ch1;
				lx.state = lex_enum.STR_INTERP;
			}
			else
				tks.push(tok_error(flp, 'Invalid escape sequence: \\' + ch1));
			break;

		case lex_enum.STR_INTERP_ESC_HEX:
			if (isHex(ch1)){
				lx.str_hexval = (lx.str_hexval << 4) + toHex(ch1);
				lx.str_hexleft--;
				if (lx.str_hexleft <= 0){
					lx.str += String.fromCharCode(lx.str_hexval);
					lx.state = lex_enum.STR_INTERP;
				}
			}
			else
				tks.push(tok_error(flp, 'Invalid escape sequence; expecting hex value'));
			break;
	}
}

function lex_add(lx: lex_st, flp: filepos_st, ch: string, tks: tok_st[]): void {
	lex_fwd(lx, flp, ch);
	lex_process(lx, tks);
}

function lex_close(lx: lex_st, flp: filepos_st, tks: tok_st[]): void {
	if (lx.braces.length > 1){
		tks.push(tok_error(flp, 'Missing end of string'));
		return;
	}
	switch (lx.state){
		case lex_enum.START:
		case lex_enum.COMMENT_LINE:
		case lex_enum.BACKSLASH:
		case lex_enum.RETURN:
			break;

		case lex_enum.COMMENT_BLOCK:
			tks.push(tok_error(lx.flpS, 'Missing end of block comment'));
			return;

		case lex_enum.SPECIAL1:
			tks.push(tok_ks(lx.flp1, ks_char(lx.ch1)));
			break;

		case lex_enum.SPECIAL2: {
			let ks2 = ks_char2(lx.ch2, lx.ch1);
			if (ks2 !== ks_enum.INVALID)
				tks.push(tok_ks(lx.flp2, ks2));
			else{
				tks.push(tok_ks(lx.flp2, ks_char(lx.ch2)));
				tks.push(tok_ks(lx.flp1, ks_char(lx.ch1)));
			}
		} break;

		case lex_enum.IDENT: {
			let ksk = ks_str(lx.str);
			if (ksk !== ks_enum.INVALID)
				tks.push(tok_ks(lx.flpS, ksk));
			else
				tks.push(tok_ident(lx.flpS, lx.str));
		} break;

		case lex_enum.NUM_0:
			tks.push(tok_num(lx.flpS, 0));
			break;

		case lex_enum.NUM_2:
			tks.push(tok_error(lx.flpS, 'Invalid number'));
			break;

		case lex_enum.NUM_BODY:
			tks.push(tok_num(lx.flpS, numpart_calc(lx.npi)));
			break;

		case lex_enum.NUM_FRAC:
			if (lx.npi.flen <= 0)
				tks.push(tok_error(lx.flpS, 'Invalid number'));
			else
				tks.push(tok_num(lx.flpS, numpart_calc(lx.npi)));
			break;

		case lex_enum.NUM_EXP:
			tks.push(tok_error(lx.flpS, 'Invalid number'));
			break;

		case lex_enum.NUM_EXP_BODY:
			if (!lx.numexp)
				tks.push(tok_error(lx.flpS, 'Invalid number'));
			else
				tks.push(tok_num(lx.flpS, numpart_calc(lx.npi)));
			break;

		case lex_enum.STR_BASIC_ESC:
			tks.push(tok_ks(lx.flpS, ks_enum.LPAREN));
			tks.push(tok_str(lx.flpS, lx.str));
			tks.push(tok_ks(flp, ks_enum.RPAREN));
			break;

		case lex_enum.STR_BASIC:
		case lex_enum.STR_INTERP:
		case lex_enum.STR_INTERP_DLR:
		case lex_enum.STR_INTERP_DLR_ID:
		case lex_enum.STR_INTERP_ESC:
		case lex_enum.STR_INTERP_ESC_HEX:
			tks.push(tok_error(lx.flpS, 'Missing end of string'));
			break;
	}
	tks.push(tok_newline(flp, false));
}

//
// expr
//

enum expr_enum {
	NIL,
	NUM,
	STR,
	LIST,
	NAMES,
	PAREN,
	GROUP,
	CAT,
	PREFIX,
	INFIX,
	CALL,
	INDEX,
	SLICE
}

interface expr_st_NIL {
	type: expr_enum.NIL;
	flp: filepos_st;
}
interface expr_st_NUM {
	type: expr_enum.NUM;
	flp: filepos_st;
	num: number;
}
interface expr_st_STR {
	type: expr_enum.STR;
	flp: filepos_st;
	str: string;
}
interface expr_st_LIST {
	type: expr_enum.LIST;
	flp: filepos_st;
	ex: expr_st | null;
}
interface expr_st_NAMES {
	type: expr_enum.NAMES;
	flp: filepos_st;
	names: string[];
}
interface expr_st_PAREN {
	type: expr_enum.PAREN;
	flp: filepos_st;
	ex: expr_st;
}
interface expr_st_GROUP {
	type: expr_enum.GROUP;
	flp: filepos_st;
	group: expr_st[];
}
interface expr_st_CAT {
	type: expr_enum.CAT;
	flp: filepos_st;
	cat: expr_st[];
}
interface expr_st_PREFIX {
	type: expr_enum.PREFIX;
	flp: filepos_st;
	ex: expr_st;
	k: ks_enum;
}
interface expr_st_INFIX {
	type: expr_enum.INFIX;
	flp: filepos_st;
	left: expr_st;
	right: expr_st | null;
	k: ks_enum;
}
interface expr_st_CALL {
	type: expr_enum.CALL;
	flp: filepos_st;
	cmd: expr_st;
	params: expr_st;
}
interface expr_st_INDEX {
	type: expr_enum.INDEX;
	flp: filepos_st;
	obj: expr_st;
	key: expr_st;
}
interface expr_st_SLICE {
	type: expr_enum.SLICE;
	flp: filepos_st;
	obj: expr_st;
	start: expr_st | null;
	len: expr_st | null;
}
type expr_st = expr_st_NIL | expr_st_NUM | expr_st_STR | expr_st_LIST | expr_st_NAMES |
	expr_st_PAREN | expr_st_GROUP | expr_st_CAT | expr_st_PREFIX | expr_st_INFIX | expr_st_CALL |
	expr_st_INDEX | expr_st_SLICE;

function expr_nil(flp: filepos_st): expr_st {
	return {
		flp: flp,
		type: expr_enum.NIL
	};
}

function expr_num(flp: filepos_st, num: number): expr_st {
	return {
		flp: flp,
		type: expr_enum.NUM,
		num: num
	};
}

function expr_str(flp: filepos_st, str: string): expr_st {
	return {
		flp: flp,
		type: expr_enum.STR,
		str: str
	};
}

function expr_list(flp: filepos_st, ex: expr_st | null): expr_st {
	return {
		flp: flp,
		type: expr_enum.LIST,
		ex: ex
	};
}

function expr_names(flp: filepos_st, names: string[]): expr_st {
	return {
		flp: flp,
		type: expr_enum.NAMES,
		names: names
	};
}

function expr_paren(flp: filepos_st, ex: expr_st): expr_st {
	if (ex.type === expr_enum.NUM)
		return ex;
	return {
		flp: flp,
		type: expr_enum.PAREN,
		ex: ex
	};
}

function expr_group(flp: filepos_st, left: expr_st, right: expr_st): expr_st {
	let g: expr_st[] = [];
	if (left.type === expr_enum.GROUP)
		g = g.concat(left.group);
	else
		g.push(left);
	if (right.type === expr_enum.GROUP)
		g = g.concat(right.group);
	else
		g.push(right);
	return {
		flp: flp,
		type: expr_enum.GROUP,
		group: g
	};
}

function expr_cat(flp: filepos_st, left: expr_st, right: expr_st): expr_st {
	// unwrap any parens
	while (left.type === expr_enum.PAREN)
		left = left.ex;
	while (right.type === expr_enum.PAREN)
		right = right.ex;

	// check for static concat
	if (left.type === expr_enum.STR && right.type === expr_enum.STR){
		left.str += right.str;
		return left;
	}
	else if (left.type === expr_enum.LIST && right.type === expr_enum.LIST){
		if (right.ex){
			if (left.ex)
				left.ex = expr_group(flp, left.ex, right.ex);
			else
				left.ex = right.ex;
		}
		return left;
	}

	let c: expr_st[] = [];
	if (left.type === expr_enum.CAT)
		c = c.concat(left.cat);
	else
		c.push(left);
	if (right.type === expr_enum.CAT)
		c = c.concat(right.cat);
	else
		c.push(right);
	return {
		flp: flp,
		type: expr_enum.CAT,
		cat: c
	};
}

function expr_prefix(flp: filepos_st, k: ks_enum, ex: expr_st): expr_st {
	if ((k === ks_enum.MINUS || k === ks_enum.UNMINUS) && ex.type === expr_enum.NUM){
		ex.num = -ex.num;
		return ex;
	}
	else if ((k === ks_enum.PLUS || k === ks_enum.UNPLUS) && ex.type === expr_enum.NUM)
		return ex;
	return {
		flp: flp,
		type: expr_enum.PREFIX,
		k: k,
		ex: ex
	};
}

function expr_infix(flp: filepos_st, k: ks_enum, left: expr_st, right: expr_st | null): expr_st {
	if (left.type === expr_enum.NUM && right !== null && right.type === expr_enum.NUM){
		// check for compile-time numeric optimizations
		if (k === ks_enum.PLUS){
			left.num += right.num;
			return left;
		}
		else if (k === ks_enum.MINUS){
			left.num -= right.num;
			return left;
		}
		else if (k === ks_enum.PERCENT){
			left.num = left.num % right.num;
			return left;
		}
		else if (k === ks_enum.STAR){
			left.num *= right.num;
			return left;
		}
		else if (k === ks_enum.SLASH){
			left.num /= right.num;
			return left;
		}
		else if (k === ks_enum.CARET){
			left.num = Math.pow(left.num, right.num);
			return left;
		}
	}
	if (k === ks_enum.COMMA && right !== null)
		return expr_group(flp, left, right);
	else if (k === ks_enum.TILDE && right !== null)
		return expr_cat(flp, left, right);
	return {
		flp: flp,
		type: expr_enum.INFIX,
		k: k,
		left: left,
		right: right
	};
}

function expr_call(flp: filepos_st, cmd: expr_st, params: expr_st): expr_st {
	return {
		flp: flp,
		type: expr_enum.CALL,
		cmd: cmd,
		params: params
	};
}

function expr_index(flp: filepos_st, obj: expr_st, key: expr_st): expr_st {
	return {
		flp: flp,
		type: expr_enum.INDEX,
		obj: obj,
		key: key
	};
}

function expr_slice(flp: filepos_st, obj: expr_st, start: expr_st | null,
	len: expr_st | null): expr_st {
	return {
		flp: flp,
		type: expr_enum.SLICE,
		obj: obj,
		start: start,
		len: len
	};
}

//
// ast
//

interface decl_st {
	local: boolean;
	flp: filepos_st; // location of names
	names: string[];
	key: string | null;
}

function decl_local(flp: filepos_st, names: string[]): decl_st {
	return {
		local: true,
		flp: flp,
		names: names,
		key: null
	};
}

function decl_native(flp: filepos_st, names: string[], key: string): decl_st {
	return {
		local: false,
		flp: flp,
		names: names,
		key: key
	};
}

enum ast_enumt {
	BREAK,
	CONTINUE,
	DECLARE,
	DEF1,
	DEF2,
	DOWHILE1,
	DOWHILE2,
	DOWHILE3,
	ENUM,
	FOR1,
	FOR2,
	LOOP1,
	LOOP2,
	GOTO,
	IF1,
	IF2,
	IF3,
	IF4,
	INCLUDE,
	NAMESPACE1,
	NAMESPACE2,
	RETURN,
	USING,
	VAR,
	EVAL,
	LABEL
}
interface ast_st_BREAK {
	type: ast_enumt.BREAK;
	flp: filepos_st;
}
interface ast_st_CONTINUE {
	type: ast_enumt.CONTINUE;
	flp: filepos_st;
}
interface ast_st_DECLARE {
	type: ast_enumt.DECLARE;
	flp: filepos_st;
	declare: decl_st
}
interface ast_st_DEF1 {
	type: ast_enumt.DEF1;
	flp: filepos_st;
	flpN: filepos_st;
	names: string[];
	lvalues: expr_st[];
}
interface ast_st_DEF2 {
	type: ast_enumt.DEF2;
	flp: filepos_st;
}
interface ast_st_DOWHILE1 {
	type: ast_enumt.DOWHILE1;
	flp: filepos_st;
}
interface ast_st_DOWHILE2 {
	type: ast_enumt.DOWHILE2;
	flp: filepos_st;
	cond: expr_st | null;
}
interface ast_st_DOWHILE3 {
	type: ast_enumt.DOWHILE3;
	flp: filepos_st;
}
interface ast_st_ENUM {
	type: ast_enumt.ENUM;
	flp: filepos_st;
	lvalues: expr_st[];
}
interface ast_st_FOR1 {
	type: ast_enumt.FOR1;
	flp: filepos_st;
	forVar: boolean;
	names1: string[] | null;
	names2: string[] | null;
	ex: expr_st;
}
interface ast_st_FOR2 {
	type: ast_enumt.FOR2;
	flp: filepos_st;
}
interface ast_st_LOOP1 {
	type: ast_enumt.LOOP1;
	flp: filepos_st;
}
interface ast_st_LOOP2 {
	type: ast_enumt.LOOP2;
	flp: filepos_st;
}
interface ast_st_GOTO {
	type: ast_enumt.GOTO;
	flp: filepos_st;
	ident: string;
}
interface ast_st_IF1 {
	type: ast_enumt.IF1;
	flp: filepos_st;
}
interface ast_st_IF2 {
	type: ast_enumt.IF2;
	flp: filepos_st;
	cond: expr_st;
}
interface ast_st_IF3 {
	type: ast_enumt.IF3;
	flp: filepos_st;
}
interface ast_st_IF4 {
	type: ast_enumt.IF4;
	flp: filepos_st;
}
interface ast_st_INCLUDE {
	type: ast_enumt.INCLUDE;
	flp: filepos_st;
	incls: incl_st[];
}
interface ast_st_NAMESPACE1 {
	type: ast_enumt.NAMESPACE1;
	flp: filepos_st;
	names: string[];
}
interface ast_st_NAMESPACE2 {
	type: ast_enumt.NAMESPACE2;
	flp: filepos_st;
}
interface ast_st_RETURN {
	type: ast_enumt.RETURN;
	flp: filepos_st;
	ex: expr_st;
}
interface ast_st_USING {
	type: ast_enumt.USING;
	flp: filepos_st;
	names: string[];
}
interface ast_st_VAR {
	type: ast_enumt.VAR;
	flp: filepos_st;
	lvalues: expr_st[];
}
interface ast_st_EVAL {
	type: ast_enumt.EVAL;
	flp: filepos_st;
	ex: expr_st;
}
interface ast_st_LABEL {
	type: ast_enumt.LABEL;
	flp: filepos_st;
	ident: string;
}
type ast_st = ast_st_BREAK | ast_st_CONTINUE | ast_st_DECLARE | ast_st_DEF1 | ast_st_DEF2 |
	ast_st_DOWHILE1 | ast_st_DOWHILE2 | ast_st_DOWHILE3 | ast_st_ENUM | ast_st_FOR1 | ast_st_FOR2 |
	ast_st_LOOP1 | ast_st_LOOP2 | ast_st_GOTO | ast_st_IF1 | ast_st_IF2 | ast_st_IF3 | ast_st_IF4 |
	ast_st_INCLUDE | ast_st_NAMESPACE1 | ast_st_NAMESPACE2 | ast_st_RETURN | ast_st_USING |
	ast_st_VAR | ast_st_EVAL | ast_st_LABEL;

function ast_break(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.BREAK
	};
}

function ast_continue(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.CONTINUE
	};
}

function ast_declare(flp: filepos_st, dc: decl_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.DECLARE,
		declare: dc
	};
}

function ast_def1(flp: filepos_st, flpN: filepos_st, names: string[], lvalues: expr_st[]): ast_st {
	return {
		flp: flp,
		type: ast_enumt.DEF1,
		flpN: flpN,
		names: names,
		lvalues: lvalues
	};
}

function ast_def2(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.DEF2
	};
}

function ast_dowhile1(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.DOWHILE1
	};
}

function ast_dowhile2(flp: filepos_st, cond: expr_st | null): ast_st {
	return {
		flp: flp,
		type: ast_enumt.DOWHILE2,
		cond: cond
	};
}

function ast_dowhile3(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.DOWHILE3
	};
}

function ast_enum(flp: filepos_st, lvalues: expr_st[]): ast_st {
	return {
		flp: flp,
		type: ast_enumt.ENUM,
		lvalues: lvalues
	};
}

function ast_for1(flp: filepos_st, forVar: boolean, names1: string[] | null,
	names2: string[] | null, ex: expr_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.FOR1,
		forVar: forVar,
		names1: names1,
		names2: names2,
		ex: ex
	};
}

function ast_for2(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.FOR2
	};
}

function ast_loop1(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.LOOP1
	};
}

function ast_loop2(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.LOOP2
	};
}

function ast_goto(flp: filepos_st, ident: string): ast_st {
	return {
		flp: flp,
		type: ast_enumt.GOTO,
		ident: ident
	};
}

function ast_if1(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.IF1
	};
}

function ast_if2(flp: filepos_st, cond: expr_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.IF2,
		cond: cond
	};
}

function ast_if3(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.IF3
	};
}

function ast_if4(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.IF4
	};
}

interface incl_st {
	names: string[] | null | true; // `true` indicates INCL_UNIQUE when using `include + 'foo'`
	file: string
}

function incl_new(names: string[] | null | true, file: string): incl_st {
	return {
		names: names,
		file: file
	};
}

function ast_include(flp: filepos_st, incls: incl_st[]): ast_st {
	return {
		flp: flp,
		type: ast_enumt.INCLUDE,
		incls: incls
	};
}

function ast_namespace1(flp: filepos_st, names: string[]): ast_st {
	return {
		flp: flp,
		type: ast_enumt.NAMESPACE1,
		names: names
	};
}

function ast_namespace2(flp: filepos_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.NAMESPACE2,
	};
}

function ast_return(flp: filepos_st, ex: expr_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.RETURN,
		ex: ex
	};
}

function ast_using(flp: filepos_st, names: string[]): ast_st {
	return {
		flp: flp,
		type: ast_enumt.USING,
		names: names
	};
}

function ast_var(flp: filepos_st, lvalues: expr_st[]): ast_st {
	return {
		flp: flp,
		type: ast_enumt.VAR,
		lvalues: lvalues
	};
}

function ast_eval(flp: filepos_st, ex: expr_st): ast_st {
	return {
		flp: flp,
		type: ast_enumt.EVAL,
		ex: ex
	};
}

function ast_label(flp: filepos_st, ident: string): ast_st {
	return {
		flp: flp,
		type: ast_enumt.LABEL,
		ident: ident
	};
}

//
// parser state helpers
//

interface ets_st {
	tk: tok_st;
	next: ets_st | null;
}

function ets_new(tk: tok_st, next: ets_st | null): ets_st { // exprPreStack, exprMidStack
	return {
		tk: tk,
		next: next
	};
}

interface exs_st {
	ex: expr_st;
	next: exs_st | null;
}

function exs_new(ex: expr_st, next: exs_st | null): exs_st { // exprStack
	return {
		ex: ex,
		next: next
	};
}

interface eps_st {
	e: ets_st;
	next: eps_st | null;
}

function eps_new(e: ets_st, next: eps_st | null){ // exprPreStackStack
	return {
		e: e,
		next: next
	};
}

//
// parser state
//

enum prs_enum {
	STATEMENT,
	STATEMENT_END,
	LOOKUP,
	LOOKUP_IDENT,
	BODY,
	BODY_STATEMENT,
	LVALUES,
	LVALUES_TERM,
	LVALUES_TERM_LOOKUP,
	LVALUES_TERM_LIST,
	LVALUES_TERM_LIST_TERM_DONE,
	LVALUES_TERM_LIST_TAIL,
	LVALUES_TERM_LIST_TAIL_LOOKUP,
	LVALUES_TERM_LIST_TAIL_DONE,
	LVALUES_TERM_LIST_DONE,
	LVALUES_TERM_DONE,
	LVALUES_TERM_EXPR,
	LVALUES_MORE,
	LVALUES_DEF_TAIL,
	LVALUES_DEF_TAIL_DONE,
	BREAK,
	CONTINUE,
	DECLARE,
	DECLARE_LOOKUP,
	DECLARE_STR,
	DECLARE_STR2,
	DECLARE_STR3,
	DEF,
	DEF_LOOKUP,
	DEF_LVALUES,
	DEF_BODY,
	DO,
	DO_BODY,
	DO_WHILE_EXPR,
	DO_WHILE_BODY,
	FOR,
	LOOP_BODY,
	FOR_VARS,
	FOR_VARS_LOOKUP,
	FOR_VARS2,
	FOR_VARS2_LOOKUP,
	FOR_VARS_DONE,
	FOR_EXPR,
	FOR_BODY,
	GOTO,
	IF,
	IF2,
	IF_EXPR,
	IF_BODY,
	ELSE_BODY,
	INCLUDE,
	INCLUDE_LOOKUP,
	INCLUDE_STR,
	INCLUDE_STR2,
	INCLUDE_STR3,
	NAMESPACE,
	NAMESPACE_LOOKUP,
	NAMESPACE_BODY,
	RETURN,
	RETURN_DONE,
	USING,
	USING_LOOKUP,
	VAR,
	VAR_LVALUES,
	IDENTS,
	ENUM,
	ENUM_LVALUES,
	EVAL,
	EVAL_EXPR,
	EXPR,
	EXPR_PRE,
	EXPR_TERM,
	EXPR_TERM_ISEMPTYLIST,
	EXPR_TERM_CLOSEBRACE,
	EXPR_TERM_CLOSEPAREN,
	EXPR_TERM_LOOKUP,
	EXPR_POST,
	EXPR_POST_CALL,
	EXPR_INDEX_CHECK,
	EXPR_INDEX_COLON_CHECK,
	EXPR_INDEX_COLON_EXPR,
	EXPR_INDEX_EXPR_CHECK,
	EXPR_INDEX_EXPR_COLON_CHECK,
	EXPR_INDEX_EXPR_COLON_EXPR,
	EXPR_COMMA,
	EXPR_MID,
	EXPR_FINISH
}

enum lvm_enum {
	VAR,
	DEF,
	ENUM,
	LIST
}

interface prs_st {
	state: prs_enum;
	lvalues: expr_st[] | null;
	lvaluesMode: lvm_enum;
	forVar: boolean;
	str: string;
	flpS: filepos_st; // statement flp
	flpL: filepos_st; // lookup flp
	flpE: filepos_st; // expr flp
	exprAllowComma: boolean;
	exprAllowPipe: boolean;
	exprAllowTrailComma: boolean;
	exprPreStackStack: eps_st | null;
	exprPreStack: ets_st | null;
	exprMidStack: ets_st | null;
	exprStack: exs_st | null;
	exprTerm: expr_st | null;
	exprTerm2: expr_st | null;
	exprTerm3: expr_st | null;
	names: string[] | null | true;
	names2: string[] | null;
	incls: incl_st[] | null;
	next: prs_st | null;
}

function prs_new(state: prs_enum, next: prs_st | null): prs_st {
	return {
		state: state,
		lvalues: null,
		lvaluesMode: lvm_enum.VAR,
		forVar: false,
		str: '',
		flpS: FILEPOS_NULL,
		flpL: FILEPOS_NULL,
		flpE: FILEPOS_NULL,
		exprAllowComma: true,
		exprAllowPipe: true,
		exprAllowTrailComma: false,
		exprPreStackStack: null,
		exprPreStack: null,
		exprMidStack: null,
		exprStack: null,
		exprTerm: null,
		exprTerm2: null,
		exprTerm3: null,
		names: null,
		names2: null,
		incls: null,
		next: next
	};
}

//
// parser
//

interface parser_st {
	state: prs_st | null;
	tkR: tok_st | null;
	tk1: tok_st | null;
	tk2: tok_st | null;
	level: number
}

function parser_new(): parser_st {
	return {
		state: prs_new(prs_enum.STATEMENT, null),
		tkR: null,
		tk1: null,
		tk2: null,
		level: 0
	};
}

function parser_fwd(pr: parser_st, tk: tok_st): void {
	pr.tk2 = pr.tk1;
	pr.tk1 = tk;
	pr.tkR = null;
}

function parser_rev(pr: parser_st): void {
	pr.tkR = pr.tk1;
	pr.tk1 = pr.tk2;
	pr.tk2 = null;
}

function parser_push(pr: parser_st, state: prs_enum): void {
	pr.state = prs_new(state, pr.state);
}

function parser_pop(pr: parser_st): void {
	if (pr.state === null)
		throw new Error('Parser state is null');
	pr.state = pr.state.next;
}

interface pri_st_OK {
	ok: true;
	ex: expr_st;
}
interface pri_st_ERROR {
	ok: false;
	msg: string;
}
type pri_st = pri_st_OK | pri_st_ERROR;

function pri_ok(ex: expr_st): pri_st {
	return { ok: true, ex: ex };
}

function pri_error(msg: string): pri_st {
	return { ok: false, msg: msg };
}

function parser_infix(flp: filepos_st, k: ks_enum, left: expr_st, right: expr_st): pri_st {
	if (k === ks_enum.PIPE){
		if (right.type === expr_enum.CALL){
			right.params = expr_infix(flp, ks_enum.COMMA, expr_paren(left.flp, left), right.params);
			return pri_ok(right);
		}
		else if (right.type === expr_enum.NAMES)
			return pri_ok(expr_call(right.flp, right, expr_paren(left.flp, left)));
		return pri_error('Invalid pipe');
	}
	return pri_ok(expr_infix(flp, k, left, right));
}

function parser_lvalues(pr: parser_st, retstate: prs_enum, lvm: lvm_enum): void {
	if (pr.state === null)
		throw new Error('Parser state is null');
	pr.state.state = retstate;
	parser_push(pr, prs_enum.LVALUES);
	pr.state.lvalues = [];
	pr.state.lvaluesMode = lvm;
}

function parser_expr(pr: parser_st, retstate: prs_enum): void {
	if (pr.state === null)
		throw new Error('Parser state is null');
	pr.state.state = retstate;
	parser_push(pr, prs_enum.EXPR);
}

function parser_start(pr: parser_st, flpS: filepos_st, state: prs_enum): null {
	if (pr.state === null)
		throw new Error('Parser state is null');
	pr.level++;
	pr.state.state = state;
	pr.state.flpS = flpS;
	return null;
}

function parser_statement(pr: parser_st, stmts: ast_st[], more: boolean): string | null {
	if (pr.state === null)
		throw new Error('Parser state is null');
	pr.level--;
	pr.state.state = prs_enum.STATEMENT_END;
	return more ? null : parser_process(pr, stmts);
}

function parser_lookup(pr: parser_st, flpL: filepos_st, retstate: prs_enum): null {
	if (pr.state === null)
		throw new Error('Parser state is null');
	if (pr.tk1 === null || pr.tk1.type !== tok_enum.IDENT)
		throw new Error('Token must be an identifier');
	pr.state.state = retstate;
	pr.state.flpL = flpL;
	parser_push(pr, prs_enum.LOOKUP);
	pr.state.names = [pr.tk1.ident];
	return null;
}

// function to enforce a tok_st_KS, to fanagle TypeScript's type-checking
function forceKS(tk: tok_st): tok_st_KS {
	if (tk.type !== tok_enum.KS)
		throw new Error('Parser mid must be keyword');
	return tk;
}

// returns null for success, or an error message
function parser_process(pr: parser_st, stmts: ast_st[]): string | null {
	if (pr.tk1 === null)
		throw new Error('Parser cannot process null token');
	if (pr.state === null)
		throw new Error('Parser cannot process null state');
	let tk1 = pr.tk1;
	let st = pr.state;
	let flpT = tk1.flp;
	let flpS = st.flpS;
	let flpL = st.flpL;
	let flpE = st.flpE;
	switch (st.state){
		case prs_enum.STATEMENT:
			if      (tk1.type === tok_enum.NEWLINE   ) return null;
			else if (tok_isKS(tk1, ks_enum.BREAK    )) return parser_start(pr, flpT, prs_enum.BREAK    );
			else if (tok_isKS(tk1, ks_enum.CONTINUE )) return parser_start(pr, flpT, prs_enum.CONTINUE );
			else if (tok_isKS(tk1, ks_enum.DECLARE  )) return parser_start(pr, flpT, prs_enum.DECLARE  );
			else if (tok_isKS(tk1, ks_enum.DEF      )) return parser_start(pr, flpT, prs_enum.DEF      );
			else if (tok_isKS(tk1, ks_enum.DO       )) return parser_start(pr, flpT, prs_enum.DO       );
			else if (tok_isKS(tk1, ks_enum.ENUM     )) return parser_start(pr, flpT, prs_enum.ENUM     );
			else if (tok_isKS(tk1, ks_enum.FOR      )) return parser_start(pr, flpT, prs_enum.FOR      );
			else if (tok_isKS(tk1, ks_enum.GOTO     )) return parser_start(pr, flpT, prs_enum.GOTO     );
			else if (tok_isKS(tk1, ks_enum.IF       )) return parser_start(pr, flpT, prs_enum.IF       );
			else if (tok_isKS(tk1, ks_enum.INCLUDE  )) return parser_start(pr, flpT, prs_enum.INCLUDE  );
			else if (tok_isKS(tk1, ks_enum.NAMESPACE)) return parser_start(pr, flpT, prs_enum.NAMESPACE);
			else if (tok_isKS(tk1, ks_enum.RETURN   )) return parser_start(pr, flpT, prs_enum.RETURN   );
			else if (tok_isKS(tk1, ks_enum.USING    )) return parser_start(pr, flpT, prs_enum.USING    );
			else if (tok_isKS(tk1, ks_enum.VAR      )) return parser_start(pr, flpT, prs_enum.VAR      );
			else if (tk1.type === tok_enum.IDENT){
				st.flpS = flpT;
				return parser_lookup(pr, flpT, prs_enum.IDENTS);
			}
			else if (tok_isPre(tk1) || tok_isTerm(tk1)){
				pr.level++;
				st.state = prs_enum.EVAL;
				st.flpS = flpT;
				return parser_process(pr, stmts);
			}
			else if (tok_isMidStmt(tk1)){
				if (st.next === null)
					return 'Invalid statement';
				parser_pop(pr);
				return parser_process(pr, stmts);
			}
			return 'Invalid statement';

		case prs_enum.STATEMENT_END:
			if (tk1.type !== tok_enum.NEWLINE)
				return 'Missing newline or semicolon';
			st.state = prs_enum.STATEMENT;
			return null;

		case prs_enum.LOOKUP:
			if (!tok_isKS(tk1, ks_enum.PERIOD)){
				if (st.next === null)
					throw new Error('Parser expecting lookup to return state');
				st.next.names = st.names;
				parser_pop(pr);
				return parser_process(pr, stmts);
			}
			st.state = prs_enum.LOOKUP_IDENT;
			return null;

		case prs_enum.LOOKUP_IDENT:
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			if (st.names === null || st.names === true)
				throw new Error('Parser expecting names to be list');
			st.names.push(tk1.ident);
			st.state = prs_enum.LOOKUP;
			return null;

		case prs_enum.BODY:
			st.state = prs_enum.BODY_STATEMENT;
			parser_push(pr, prs_enum.STATEMENT);
			return parser_process(pr, stmts);

		case prs_enum.BODY_STATEMENT:
			if (tok_isMidStmt(tk1)){
				parser_pop(pr);
				return parser_process(pr, stmts);
			}
			parser_push(pr, prs_enum.STATEMENT);
			return null;

		case prs_enum.LVALUES:
			if (tk1.type === tok_enum.NEWLINE){
				if (st.next === null)
					throw new Error('Parser expecting lvalues to return state');
				st.next.lvalues = st.lvalues;
				parser_pop(pr);
				return parser_process(pr, stmts);
			}
			st.state = prs_enum.LVALUES_TERM_DONE;
			parser_push(pr, prs_enum.LVALUES_TERM);
			pr.state.lvaluesMode = st.lvaluesMode;
			return parser_process(pr, stmts);

		case prs_enum.LVALUES_TERM:
			if (tk1.type === tok_enum.IDENT)
				return parser_lookup(pr, flpT, prs_enum.LVALUES_TERM_LOOKUP);
			if (st.lvaluesMode === lvm_enum.ENUM)
				return 'Expecting enumerator name';
			if (tok_isKS(tk1, ks_enum.LBRACE)){
				st.state = prs_enum.LVALUES_TERM_LIST_DONE;
				st.flpE = flpT;
				parser_push(pr, prs_enum.LVALUES_TERM_LIST);
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.PERIOD3)){
				if (st.lvaluesMode === lvm_enum.DEF){
					st.state = prs_enum.LVALUES_DEF_TAIL;
					return null;
				}
				else if (st.lvaluesMode === lvm_enum.LIST){
					st.state = prs_enum.LVALUES_TERM_LIST_TAIL;
					return null;
				}
			}
			return 'Expecting variable';

		case prs_enum.LVALUES_TERM_LOOKUP:
			if (st.next === null)
				throw new Error('Parser expecting lvalues to return state');
			if (st.names === null || st.names === true)
				throw new Error('Parser expecting names to be list of strings');
			st.next.exprTerm = expr_names(flpL, st.names);
			parser_pop(pr);
			return parser_process(pr, stmts);

		case prs_enum.LVALUES_TERM_LIST:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			else if (tok_isKS(tk1, ks_enum.RBRACE)){
				if (st.next === null)
					throw new Error('Parser expecting lvalues to return state');
				st.next.exprTerm = st.exprTerm;
				parser_pop(pr);
				return null;
			}
			st.state = prs_enum.LVALUES_TERM_LIST_TERM_DONE;
			parser_push(pr, prs_enum.LVALUES_TERM);
			pr.state.lvaluesMode = lvm_enum.LIST;
			return parser_process(pr, stmts);

		case prs_enum.LVALUES_TERM_LIST_TERM_DONE:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (st.exprTerm2 === null){
				st.exprTerm2 = st.exprTerm;
				st.exprTerm = null;
			}
			else{
				if (st.exprTerm === null)
					throw new Error('Parser expression cannot be null');
				st.exprTerm2 =
					expr_infix(st.exprTerm2.flp, ks_enum.COMMA, st.exprTerm2, st.exprTerm);
				st.exprTerm = null;
			}
			if (tok_isKS(tk1, ks_enum.RBRACE)){
				if (st.next === null)
					throw new Error('Parser expecting lvalues to return state');
				st.next.exprTerm = st.exprTerm2;
				st.exprTerm2 = null;
				parser_pop(pr);
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.COMMA)){
				parser_push(pr, prs_enum.LVALUES_TERM);
				pr.state.lvaluesMode = lvm_enum.LIST;
				return null;
			}
			return 'Invalid list';

		case prs_enum.LVALUES_TERM_LIST_TAIL:
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			return parser_lookup(pr, flpT, prs_enum.LVALUES_TERM_LIST_TAIL_LOOKUP);

		case prs_enum.LVALUES_TERM_LIST_TAIL_LOOKUP:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			st.state = prs_enum.LVALUES_TERM_LIST_TAIL_DONE;
			if (tok_isKS(tk1, ks_enum.COMMA))
				return null;
			return parser_process(pr, stmts);

		case prs_enum.LVALUES_TERM_LIST_TAIL_DONE:
			if (!tok_isKS(tk1, ks_enum.RBRACE))
				return 'Missing end of list';
			if (st.next === null)
				throw new Error('Parser expecting lvalues to return state');
			if (st.names === null || st.names === true)
				throw new Error('Parser lvalues should be list of strings');
			st.next.exprTerm = expr_prefix(flpL, ks_enum.PERIOD3, expr_names(flpL, st.names));
			parser_pop(pr);
			return parser_process(pr, stmts);

		case prs_enum.LVALUES_TERM_LIST_DONE:
			if (st.next === null)
				throw new Error('Parser expecting lvalues to return state');
			if (st.exprTerm === null)
				throw new Error('Parser expecting lvalues expression');
			st.next.exprTerm = expr_list(flpE, st.exprTerm);
			parser_pop(pr);
			return parser_process(pr, stmts);

		case prs_enum.LVALUES_TERM_DONE:
			if (st.lvalues === null)
				throw new Error('Parser expecting lvalues as list of expressions');
			if (st.exprTerm === null)
				throw new Error('Parser expecting expression to be non-null');
			if (st.next === null)
				throw new Error('Parser expecting lvalues to return state');
			if (tk1.type === tok_enum.NEWLINE){
				st.lvalues.push(expr_infix(flpT, ks_enum.EQU, st.exprTerm, null));
				st.next.lvalues = st.lvalues;
				parser_pop(pr);
				return parser_process(pr, stmts);
			}
			else if (tok_isKS(tk1, ks_enum.EQU)){
				st.exprTerm2 = st.exprTerm;
				st.exprTerm = null;
				parser_expr(pr, prs_enum.LVALUES_TERM_EXPR);
				pr.state.exprAllowComma = false;
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.COMMA)){
				st.lvalues.push(expr_infix(st.exprTerm.flp, ks_enum.EQU, st.exprTerm, null));
				st.exprTerm = null;
				st.state = prs_enum.LVALUES_MORE;
				return null;
			}
			return 'Invalid declaration';

		case prs_enum.LVALUES_TERM_EXPR:
			if (st.lvalues === null)
				throw new Error('Parser expecting lvalues as list of expressions');
			if (st.exprTerm2 === null)
				throw new Error('Parser expecting expression to be non-null');
			if (st.next === null)
				throw new Error('Parser expecting lvalues to return state');
			st.lvalues.push(expr_infix(st.exprTerm2.flp, ks_enum.EQU, st.exprTerm2, st.exprTerm));
			st.exprTerm2 = null;
			st.exprTerm = null;
			if (tk1.type === tok_enum.NEWLINE){
				st.next.lvalues = st.lvalues;
				parser_pop(pr);
				return parser_process(pr, stmts);
			}
			else if (tok_isKS(tk1, ks_enum.COMMA)){
				st.state = prs_enum.LVALUES_MORE;
				return null;
			}
			return 'Invalid declaration';

		case prs_enum.LVALUES_MORE:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			st.state = prs_enum.LVALUES_TERM_DONE;
			parser_push(pr, prs_enum.LVALUES_TERM);
			pr.state.lvaluesMode = st.lvaluesMode;
			return parser_process(pr, stmts);

		case prs_enum.LVALUES_DEF_TAIL:
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			return parser_lookup(pr, flpT, prs_enum.LVALUES_DEF_TAIL_DONE);

		case prs_enum.LVALUES_DEF_TAIL_DONE:
			if (tk1.type !== tok_enum.NEWLINE)
				return 'Missing newline or semicolon';
			if (st.next === null)
				throw new Error('Parser expecting lvalues to return state');
			st.next.names = st.names;
			parser_pop(pr);
			st = pr.state;
			if (st.lvalues === null)
				throw new Error('Parser expecting lvalues to be list of expressions');
			if (st.names === null || st.names === true)
				throw new Error('Parser expecting names to be list of strings');
			if (st.next === null)
				throw new Error('Parser expecting lvalues to return state');
			st.lvalues.push(expr_prefix(flpL, ks_enum.PERIOD3, expr_names(flpL, st.names)));
			st.next.lvalues = st.lvalues;
			parser_pop(pr);
			return parser_process(pr, stmts);

		case prs_enum.BREAK:
			stmts.push(ast_break(flpS));
			return parser_statement(pr, stmts, false);

		case prs_enum.CONTINUE:
			stmts.push(ast_continue(flpS));
			return parser_statement(pr, stmts, false);

		case prs_enum.DECLARE:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			return parser_lookup(pr, flpT, prs_enum.DECLARE_LOOKUP);

		case prs_enum.DECLARE_LOOKUP:
			if (tok_isKS(tk1, ks_enum.LPAREN)){
				st.state = prs_enum.DECLARE_STR;
				return null;
			}
			if (st.names === null || st.names === true)
				throw new Error('Parser expecting declare lookup to return names');
			stmts.push(ast_declare(flpS, decl_local(flpL, st.names)));
			if (tok_isKS(tk1, ks_enum.COMMA)){
				st.state = prs_enum.DECLARE;
				return null;
			}
			return parser_statement(pr, stmts, false);

		case prs_enum.DECLARE_STR:
			if (tk1.type !== tok_enum.STR)
				return 'Expecting string constant';
			if (st.names === null || st.names === true)
				throw new Error('Parser expecting declare lookup to return names');
			stmts.push(ast_declare(flpS, decl_native(flpL, st.names, tk1.str)));
			st.state = prs_enum.DECLARE_STR2;
			return null;

		case prs_enum.DECLARE_STR2:
			if (!tok_isKS(tk1, ks_enum.RPAREN))
				return 'Expecting string constant';
			st.state = prs_enum.DECLARE_STR3;
			return null;

		case prs_enum.DECLARE_STR3:
			if (tok_isKS(tk1, ks_enum.COMMA)){
				st.state = prs_enum.DECLARE;
				return null;
			}
			return parser_statement(pr, stmts, false);

		case prs_enum.DEF:
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			return parser_lookup(pr, flpT, prs_enum.DEF_LOOKUP);

		case prs_enum.DEF_LOOKUP:
			parser_lvalues(pr, prs_enum.DEF_LVALUES, lvm_enum.DEF);
			return parser_process(pr, stmts);

		case prs_enum.DEF_LVALUES:
			if (tk1.type !== tok_enum.NEWLINE)
				return 'Missing newline or semicolon';
			if (st.names === null || st.names === true)
				throw new Error('Parser def expecting names');
			if (st.lvalues === null)
				throw new Error('Parser def expecting lvalues');
			stmts.push(ast_def1(flpS, flpL, st.names, st.lvalues));
			st.state = prs_enum.DEF_BODY;
			parser_push(pr, prs_enum.BODY);
			return null;

		case prs_enum.DEF_BODY:
			if (!tok_isKS(tk1, ks_enum.END))
				return 'Missing `end` of def block';
			stmts.push(ast_def2(flpS));
			return parser_statement(pr, stmts, true);

		case prs_enum.DO:
			stmts.push(ast_dowhile1(flpS));
			st.state = prs_enum.DO_BODY;
			parser_push(pr, prs_enum.BODY);
			return parser_process(pr, stmts);

		case prs_enum.DO_BODY:
			if (tok_isKS(tk1, ks_enum.WHILE)){
				parser_expr(pr, prs_enum.DO_WHILE_EXPR);
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.END)){
				stmts.push(ast_dowhile2(flpS, null));
				stmts.push(ast_dowhile3(flpS));
				return parser_statement(pr, stmts, true);
			}
			return 'Missing `while` or `end` of do block';

		case prs_enum.DO_WHILE_EXPR:
			stmts.push(ast_dowhile2(flpS, st.exprTerm));
			st.exprTerm = null;
			if (tk1.type === tok_enum.NEWLINE){
				st.state = prs_enum.DO_WHILE_BODY;
				parser_push(pr, prs_enum.BODY);
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.END)){
				stmts.push(ast_dowhile3(flpS));
				return parser_statement(pr, stmts, true);
			}
			return 'Missing newline or semicolon';

		case prs_enum.DO_WHILE_BODY:
			if (!tok_isKS(tk1, ks_enum.END))
				return 'Missing `end` of do-while block';
			stmts.push(ast_dowhile3(flpS));
			return parser_statement(pr, stmts, true);

		case prs_enum.FOR:
			if (tk1.type === tok_enum.NEWLINE){
				stmts.push(ast_loop1(flpS));
				st.state = prs_enum.LOOP_BODY;
				parser_push(pr, prs_enum.BODY);
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.COLON)){
				st.state = prs_enum.FOR_VARS_DONE;
				return null;
			}
			st.state = prs_enum.FOR_VARS;
			if (tok_isKS(tk1, ks_enum.VAR)){
				st.forVar = true;
				return null;
			}
			return parser_process(pr, stmts);

		case prs_enum.LOOP_BODY:
			if (!tok_isKS(tk1, ks_enum.END))
				return 'Missing `end` of for block';
			stmts.push(ast_loop2(flpS));
			return parser_statement(pr, stmts, true);

		case prs_enum.FOR_VARS:
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			return parser_lookup(pr, flpT, prs_enum.FOR_VARS_LOOKUP);

		case prs_enum.FOR_VARS_LOOKUP:
			if (st.names === null || st.names === true)
				throw new Error('Parser `for` lookup expecting names');
			st.names2 = st.names;
			st.names = null;
			if (tok_isKS(tk1, ks_enum.COMMA)){
				st.state = prs_enum.FOR_VARS2;
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.COLON)){
				st.state = prs_enum.FOR_VARS_DONE;
				return null;
			}
			return 'Invalid for loop';

		case prs_enum.FOR_VARS2:
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			return parser_lookup(pr, flpT, prs_enum.FOR_VARS2_LOOKUP);

		case prs_enum.FOR_VARS2_LOOKUP:
			if (!tok_isKS(tk1, ks_enum.COLON))
				return 'Expecting `:`';
			st.state = prs_enum.FOR_VARS_DONE;
			return null;

		case prs_enum.FOR_VARS_DONE:
			if (tk1.type === tok_enum.NEWLINE)
				return 'Expecting expression in for statement';
			parser_expr(pr, prs_enum.FOR_EXPR);
			return parser_process(pr, stmts);

		case prs_enum.FOR_EXPR:
			if (st.names === true)
				throw new Error('Parser execting `for` names to be list of strings');
			if (st.exprTerm === null)
				throw new Error('Parser expecting `for` expression');
			stmts.push(ast_for1(flpS, st.forVar, st.names2, st.names, st.exprTerm));
			st.names2 = null;
			st.names = null;
			st.exprTerm = null;
			if (tk1.type === tok_enum.NEWLINE){
				st.state = prs_enum.FOR_BODY;
				parser_push(pr, prs_enum.BODY);
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.END)){
				stmts.push(ast_for2(flpS));
				return parser_statement(pr, stmts, true);
			}
			return 'Missing newline or semicolon';

		case prs_enum.FOR_BODY:
			if (!tok_isKS(tk1, ks_enum.END))
				return 'Missing `end` of for block';
			stmts.push(ast_for2(flpS));
			return parser_statement(pr, stmts, true);

		case prs_enum.GOTO:
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			stmts.push(ast_goto(flpS, tk1.ident));
			return parser_statement(pr, stmts, true);

		case prs_enum.IF:
			stmts.push(ast_if1(flpS));
			st.state = prs_enum.IF2;
			return parser_process(pr, stmts);

		case prs_enum.IF2:
			if (tk1.type === tok_enum.NEWLINE)
				return 'Missing conditional expression';
			parser_expr(pr, prs_enum.IF_EXPR);
			return parser_process(pr, stmts);

		case prs_enum.IF_EXPR:
			if (st.exprTerm === null)
				throw new Error('Parser expecting `if` expression');
			stmts.push(ast_if2(flpS, st.exprTerm));
			st.exprTerm = null;
			if (tk1.type === tok_enum.NEWLINE){
				st.state = prs_enum.IF_BODY;
				parser_push(pr, prs_enum.BODY);
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.ELSEIF)){
				st.state = prs_enum.IF2;
				return null;
			}
			stmts.push(ast_if3(flpS));
			if (tok_isKS(tk1, ks_enum.ELSE)){
				st.state = prs_enum.ELSE_BODY;
				parser_push(pr, prs_enum.BODY);
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.END)){
				stmts.push(ast_if4(flpS));
				return parser_statement(pr, stmts, true);
			}
			return 'Missing newline or semicolon';

		case prs_enum.IF_BODY:
			if (tok_isKS(tk1, ks_enum.ELSEIF)){
				st.state = prs_enum.IF2;
				return null;
			}
			stmts.push(ast_if3(flpS));
			if (tok_isKS(tk1, ks_enum.ELSE)){
				st.state = prs_enum.ELSE_BODY;
				parser_push(pr, prs_enum.BODY);
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.END)){
				stmts.push(ast_if4(flpS));
				return parser_statement(pr, stmts, true);
			}
			return 'Missing `elseif`, `else`, or `end` of if block';

		case prs_enum.ELSE_BODY:
			if (!tok_isKS(tk1, ks_enum.END))
				return 'Missing `end` of if block';
			stmts.push(ast_if4(flpS));
			return parser_statement(pr, stmts, true);

		case prs_enum.ENUM:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			parser_lvalues(pr, prs_enum.ENUM_LVALUES, lvm_enum.ENUM);
			return parser_process(pr, stmts);

		case prs_enum.ENUM_LVALUES:
			if (st.lvalues === null)
				throw new Error('Parser expecting `enum` lvalues');
			if (st.lvalues.length <= 0)
				return 'Invalid enumerator declaration';
			stmts.push(ast_enum(flpS, st.lvalues));
			st.lvalues = null;
			return parser_statement(pr, stmts, false);

		case prs_enum.INCLUDE:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			else if (tk1.type === tok_enum.IDENT)
				return parser_lookup(pr, flpT, prs_enum.INCLUDE_LOOKUP);
			else if (tok_isKS(tk1, ks_enum.LPAREN)){
				st.state = prs_enum.INCLUDE_STR;
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.PLUS)){
				st.names = true;
				st.state = prs_enum.INCLUDE_LOOKUP;
				return null;
			}
			return 'Expecting file as constant string literal';

		case prs_enum.INCLUDE_LOOKUP:
			if (!tok_isKS(tk1, ks_enum.LPAREN))
				return 'Expecting file as constant string literal';
			st.state = prs_enum.INCLUDE_STR;
			return null;

		case prs_enum.INCLUDE_STR:
			if (tk1.type !== tok_enum.STR)
				return 'Expecting file as constant string literal';
			st.str = tk1.str;
			st.state = prs_enum.INCLUDE_STR2;
			return null;

		case prs_enum.INCLUDE_STR2:
			if (!tok_isKS(tk1, ks_enum.RPAREN))
				return 'Expecting file as constant string literal';
			st.state = prs_enum.INCLUDE_STR3;
			return null;

		case prs_enum.INCLUDE_STR3:
			if (st.incls === null)
				st.incls = [];
			st.incls.push(incl_new(st.names, st.str));
			st.names = null;
			st.str = '';
			if (tok_isKS(tk1, ks_enum.COMMA)){
				st.state = prs_enum.INCLUDE;
				return null;
			}
			stmts.push(ast_include(flpS, st.incls));
			st.incls = null;
			return parser_statement(pr, stmts, false);

		case prs_enum.NAMESPACE:
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			return parser_lookup(pr, flpT, prs_enum.NAMESPACE_LOOKUP);

		case prs_enum.NAMESPACE_LOOKUP:
			if (tk1.type !== tok_enum.NEWLINE)
				return 'Missing newline or semicolon';
			if (st.names === null || st.names === true)
				throw new Error('Parser expecting `namespace` names');
			stmts.push(ast_namespace1(flpS, st.names));
			st.state = prs_enum.NAMESPACE_BODY;
			parser_push(pr, prs_enum.BODY);
			return null;

		case prs_enum.NAMESPACE_BODY:
			if (!tok_isKS(tk1, ks_enum.END))
				return 'Missing `end` of namespace block';
			stmts.push(ast_namespace2(flpS));
			return parser_statement(pr, stmts, true);

		case prs_enum.RETURN:
			if (tk1.type === tok_enum.NEWLINE){
				stmts.push(ast_return(flpS, expr_nil(flpS)));
				return parser_statement(pr, stmts, false);
			}
			parser_expr(pr, prs_enum.RETURN_DONE);
			return parser_process(pr, stmts);

		case prs_enum.RETURN_DONE:
			if (st.exprTerm === null)
				throw new Error('Parser expecting `return` expression');
			stmts.push(ast_return(flpS, st.exprTerm));
			st.exprTerm = null;
			return parser_statement(pr, stmts, false);

		case prs_enum.USING:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (tk1.type !== tok_enum.IDENT)
				return 'Expecting identifier';
			return parser_lookup(pr, flpT, prs_enum.USING_LOOKUP);

		case prs_enum.USING_LOOKUP:
			if (st.names === null || st.names === true)
				throw new Error('Parser expecting `using` names');
			stmts.push(ast_using(flpS, st.names));
			if (tok_isKS(tk1, ks_enum.COMMA)){
				st.state = prs_enum.USING;
				return null;
			}
			return parser_statement(pr, stmts, false);

		case prs_enum.VAR:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			parser_lvalues(pr, prs_enum.VAR_LVALUES, lvm_enum.VAR);
			return parser_process(pr, stmts);

		case prs_enum.VAR_LVALUES:
			if (st.lvalues === null)
				throw new Error('Parser expecting `var` lvalues');
			if (st.lvalues.length <= 0)
				return 'Invalid variable declaration';
			stmts.push(ast_var(flpS, st.lvalues));
			return parser_statement(pr, stmts, false);

		case prs_enum.IDENTS:
			if (st.names === null || st.names === true)
				throw new Error('Parser expecting list of strings for names');
			if (st.names.length === 1 && tok_isKS(tk1, ks_enum.COLON)){
				stmts.push(ast_label(st.flpS, st.names[0]));
				st.state = prs_enum.STATEMENT;
				return null;
			}
			pr.level++;
			st.state = prs_enum.EVAL_EXPR;
			parser_push(pr, prs_enum.EXPR_POST);
			pr.state.exprTerm = expr_names(flpL, st.names);
			return parser_process(pr, stmts);

		case prs_enum.EVAL:
			parser_expr(pr, prs_enum.EVAL_EXPR);
			return parser_process(pr, stmts);

		case prs_enum.EVAL_EXPR:
			if (st.exprTerm === null)
				throw new Error('Parser expecting expression');
			stmts.push(ast_eval(flpS, st.exprTerm));
			st.exprTerm = null;
			return parser_statement(pr, stmts, false);

		case prs_enum.EXPR:
			st.flpE = flpT;
			st.state = prs_enum.EXPR_PRE;
			// fall through
		case prs_enum.EXPR_PRE:
			if (tok_isPre(tk1)){
				st.exprPreStack = ets_new(tk1, st.exprPreStack);
				return null;
			}
			st.state = prs_enum.EXPR_TERM;
			return parser_process(pr, stmts);

		case prs_enum.EXPR_TERM:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			else if (tok_isKS(tk1, ks_enum.NIL)){
				st.state = prs_enum.EXPR_POST;
				st.exprTerm = expr_nil(flpT);
				return null;
			}
			else if (tk1.type === tok_enum.NUM){
				st.state = prs_enum.EXPR_POST;
				st.exprTerm = expr_num(flpT, tk1.num);
				return null;
			}
			else if (tk1.type === tok_enum.STR){
				st.state = prs_enum.EXPR_POST;
				st.exprTerm = expr_str(flpT, tk1.str);
				return null;
			}
			else if (tk1.type === tok_enum.IDENT)
				return parser_lookup(pr, flpT, prs_enum.EXPR_TERM_LOOKUP);
			else if (tok_isKS(tk1, ks_enum.LBRACE)){
				st.state = prs_enum.EXPR_TERM_ISEMPTYLIST;
				return null;
			}
			else if (tok_isKS(tk1, ks_enum.LPAREN)){
				parser_expr(pr, prs_enum.EXPR_TERM_CLOSEPAREN);
				pr.state.exprAllowTrailComma = true;
				return null;
			}
			return 'Invalid expression';

		case prs_enum.EXPR_TERM_ISEMPTYLIST:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			else if (tok_isKS(tk1, ks_enum.RBRACE)){
				st.state = prs_enum.EXPR_POST;
				st.exprTerm = expr_list(flpE, null);
				return null;
			}
			parser_expr(pr, prs_enum.EXPR_TERM_CLOSEBRACE);
			pr.state.exprAllowTrailComma = true;
			return parser_process(pr, stmts);

		case prs_enum.EXPR_TERM_CLOSEBRACE:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (!tok_isKS(tk1, ks_enum.RBRACE))
				return 'Expecting close brace';
			st.exprTerm = expr_list(flpE, st.exprTerm);
			st.state = prs_enum.EXPR_POST;
			return null;

		case prs_enum.EXPR_TERM_CLOSEPAREN:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (!tok_isKS(tk1, ks_enum.RPAREN))
				return 'Expecting close parenthesis';
			if (st.exprTerm === null)
				throw new Error('Parser expecting parenthesis to contain expression');
			st.exprTerm = expr_paren(st.exprTerm.flp, st.exprTerm);
			st.state = prs_enum.EXPR_POST;
			return null;

		case prs_enum.EXPR_TERM_LOOKUP:
			if (st.names === null || st.names === true)
				throw new Error('Parser expression expecting names');
			st.exprTerm = expr_names(flpL, st.names);
			st.state = prs_enum.EXPR_POST;
			return parser_process(pr, stmts);

		case prs_enum.EXPR_POST:
			if (tk1.type === tok_enum.NEWLINE || tok_isKS(tk1, ks_enum.END) ||
				tok_isKS(tk1, ks_enum.ELSE) || tok_isKS(tk1, ks_enum.ELSEIF)){
				st.state = prs_enum.EXPR_FINISH;
				return parser_process(pr, stmts);
			}
			else if (tok_isKS(tk1, ks_enum.LBRACKET)){
				st.state = prs_enum.EXPR_INDEX_CHECK;
				return null;
			}
			else if (tok_isMid(tk1, st.exprAllowComma, st.exprAllowPipe)){
				if (st.exprAllowTrailComma && tok_isKS(tk1, ks_enum.COMMA)){
					st.state = prs_enum.EXPR_COMMA;
					return null;
				}
				st.state = prs_enum.EXPR_MID;
				return parser_process(pr, stmts);
			}
			else if (tok_isKS(tk1, ks_enum.RBRACE) || tok_isKS(tk1, ks_enum.RBRACKET) ||
				tok_isKS(tk1, ks_enum.RPAREN) || tok_isKS(tk1, ks_enum.COLON) ||
				tok_isKS(tk1, ks_enum.COMMA) || tok_isKS(tk1, ks_enum.PIPE)){
				st.state = prs_enum.EXPR_FINISH;
				return parser_process(pr, stmts);
			}
			// otherwise, this should be a call
			st.exprTerm2 = st.exprTerm;
			st.exprTerm = null;
			parser_expr(pr, prs_enum.EXPR_POST_CALL);
			pr.state.exprAllowPipe = false;
			return parser_process(pr, stmts);

		case prs_enum.EXPR_POST_CALL:
			if (st.exprTerm2 === null || st.exprTerm === null)
				throw new Error('Parser call expecting expressions');
			st.exprTerm = expr_call(st.exprTerm2.flp, st.exprTerm2, st.exprTerm);
			st.exprTerm2 = null;
			st.state = prs_enum.EXPR_POST;
			return parser_process(pr, stmts);

		case prs_enum.EXPR_INDEX_CHECK:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (tok_isKS(tk1, ks_enum.COLON)){
				st.state = prs_enum.EXPR_INDEX_COLON_CHECK;
				return null;
			}
			st.exprTerm2 = st.exprTerm;
			st.exprTerm = null;
			parser_expr(pr, prs_enum.EXPR_INDEX_EXPR_CHECK);
			return parser_process(pr, stmts);

		case prs_enum.EXPR_INDEX_COLON_CHECK:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (tok_isKS(tk1, ks_enum.RBRACKET)){
				if (st.exprTerm === null)
					throw new Error('Parser expression index expecting object for indexing');
				st.exprTerm = expr_slice(flpT, st.exprTerm, null, null);
				st.state = prs_enum.EXPR_POST;
				return null;
			}
			st.exprTerm2 = st.exprTerm;
			st.exprTerm = null;
			parser_expr(pr, prs_enum.EXPR_INDEX_COLON_EXPR);
			return parser_process(pr, stmts);

		case prs_enum.EXPR_INDEX_COLON_EXPR:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (!tok_isKS(tk1, ks_enum.RBRACKET))
				return 'Missing close bracket';
			if (st.exprTerm2 === null || st.exprTerm === null)
				throw new Error('Parser expression index expecting object for indexing');
			st.exprTerm = expr_slice(st.exprTerm.flp, st.exprTerm2, null, st.exprTerm);
			st.exprTerm2 = null;
			st.state = prs_enum.EXPR_POST;
			return null;

		case prs_enum.EXPR_INDEX_EXPR_CHECK:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (tok_isKS(tk1, ks_enum.COLON)){
				st.state = prs_enum.EXPR_INDEX_EXPR_COLON_CHECK;
				return null;
			}
			if (!tok_isKS(tk1, ks_enum.RBRACKET))
				return 'Missing close bracket';
			if (st.exprTerm2 === null || st.exprTerm === null)
				throw new Error('Parser expression index expecting object for indexing');
			st.exprTerm = expr_index(st.exprTerm.flp, st.exprTerm2, st.exprTerm);
			st.exprTerm2 = null;
			st.state = prs_enum.EXPR_POST;
			return null;

		case prs_enum.EXPR_INDEX_EXPR_COLON_CHECK:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (tok_isKS(tk1, ks_enum.RBRACKET)){
				if (st.exprTerm === null || st.exprTerm2 === null)
					throw new Error('Parser expression index expecting object for indexing');
				st.exprTerm = expr_slice(st.exprTerm.flp, st.exprTerm2, st.exprTerm, null);
				st.exprTerm2 = null;
				st.state = prs_enum.EXPR_POST;
				return null;
			}
			st.exprTerm3 = st.exprTerm;
			st.exprTerm = null;
			parser_expr(pr, prs_enum.EXPR_INDEX_EXPR_COLON_EXPR);
			return parser_process(pr, stmts);

		case prs_enum.EXPR_INDEX_EXPR_COLON_EXPR:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft)
				return null;
			if (!tok_isKS(tk1, ks_enum.RBRACKET))
				return 'Missing close bracket';
			if (st.exprTerm3 === null || st.exprTerm2 === null || st.exprTerm === null)
				throw new Error('Parser expression index expecting expressions');
			st.exprTerm =
				expr_slice(st.exprTerm3.flp, st.exprTerm2, st.exprTerm3, st.exprTerm);
			st.exprTerm2 = null;
			st.exprTerm3 = null;
			st.state = prs_enum.EXPR_POST;
			return null;

		case prs_enum.EXPR_COMMA:
			if (tk1.type === tok_enum.NEWLINE && !tk1.soft){
				parser_rev(pr); // keep the comma in tk1
				pr.tkR = null;
				return null;
			}
			if (!tok_isKS(tk1, ks_enum.RPAREN) && !tok_isKS(tk1, ks_enum.RBRACE)){
				st.state = prs_enum.EXPR_MID;
				parser_rev(pr);
				parser_process(pr, stmts);
				if (pr.tkR === null)
					throw new Error('Parser reverse should have set tkR');
				parser_fwd(pr, pr.tkR);
				return parser_process(pr, stmts);
			}
			// found a trailing comma
			st.state = prs_enum.EXPR_FINISH;
			return parser_process(pr, stmts);

		case prs_enum.EXPR_MID:
			if (!tok_isMid(tk1, st.exprAllowComma, st.exprAllowPipe)){
				st.state = prs_enum.EXPR_FINISH;
				return parser_process(pr, stmts);
			}
			while (true){
				// fight between the Pre and the Mid
				while (true){
					if (tk1.type !== tok_enum.KS || st.exprPreStack === null ||
						st.exprPreStack.tk.type !== tok_enum.KS)
						throw new Error('Parser expression mid expecting keyword');
					if (st.exprPreStack === null || !tok_isPreBeforeMid(st.exprPreStack.tk, tk1))
						break;
					// apply the Pre
					let ptk = st.exprPreStack.tk;
					if (st.exprTerm === null)
						throw new Error('Parser expression mid expecting expression');
					st.exprTerm = expr_prefix(ptk.flp, ptk.k, st.exprTerm);
					st.exprPreStack = st.exprPreStack.next;
				}

				// if we've exhaused the exprPreStack, then check against the exprMidStack
				if (st.exprPreStack === null && st.exprMidStack !== null &&
					tok_isMidBeforeMid(forceKS(st.exprMidStack.tk), tk1)){
					// apply the previous Mid
					let mtk = forceKS(st.exprMidStack.tk);
					if (st.exprStack === null)
						throw new Error('Parser expression mid expecting expression stack');
					if (st.exprTerm === null)
						throw new Error('Parser expression mid expecting expression');
					let pri = parser_infix(mtk.flp, mtk.k, st.exprStack.ex, st.exprTerm);
					if (!pri.ok)
						return pri.msg;
					st.exprTerm = pri.ex;
					st.exprStack = st.exprStack.next;
					if (st.exprPreStackStack === null)
						throw new Error('Parser expression mid pre-stack-stack must be non-null');
					st.exprPreStack = st.exprPreStackStack.e;
					st.exprPreStackStack = st.exprPreStackStack.next;
					st.exprMidStack = st.exprMidStack.next;
				}
				else // otherwise, the current Mid wins
					break;
			}
			// finally, we're safe to apply the Mid...
			// except instead of applying it, we need to schedule to apply it, in case another
			// operator takes precedence over this one
			st.exprPreStackStack = eps_new(st.exprPreStack, st.exprPreStackStack);
			st.exprPreStack = null;
			if (st.exprTerm === null)
				throw new Error('Parser expression mid expecting expression');
			st.exprStack = exs_new(st.exprTerm, st.exprStack);
			st.exprTerm = null;
			st.exprMidStack = ets_new(tk1, st.exprMidStack);
			pr.tk1 = null;
			st.state = prs_enum.EXPR_PRE;
			return null;

		case prs_enum.EXPR_FINISH:
			while (true){
				// apply any outstanding Pre's
				while (st.exprPreStack !== null){
					let ptk = forceKS(st.exprPreStack.tk);
					if (st.exprTerm === null)
						throw new Error('Parser expression end expecting expression');
					st.exprTerm = expr_prefix(ptk.flp, ptk.k, st.exprTerm);
					st.exprPreStack = st.exprPreStack.next;
				}

				// grab left side's Pre's
				if (st.exprPreStackStack !== null){
					st.exprPreStack = st.exprPreStackStack.e;
					st.exprPreStackStack = st.exprPreStackStack.next;
				}

				// fight between the left Pre and the Mid
				while (st.exprPreStack !== null &&
					(st.exprMidStack === null || tok_isPreBeforeMid(
						forceKS(st.exprPreStack.tk), forceKS(st.exprMidStack.tk)))){
					// apply the Pre to the left side
					let ptk = forceKS(st.exprPreStack.tk);
					if (st.exprStack === null)
						throw new Error('Parser expression end expecting expression stack');
					st.exprStack.ex = expr_prefix(ptk.flp, ptk.k, st.exprStack.ex);
					st.exprPreStack = st.exprPreStack.next;
				}

				if (st.exprMidStack === null)
					break;

				// apply the Mid
				let mtk = forceKS(st.exprMidStack.tk);
				if (st.exprStack === null || st.exprTerm === null)
					throw new Error('Parser expression end expecting expression stack');
				let pri = parser_infix(mtk.flp, mtk.k, st.exprStack.ex, st.exprTerm);
				if (!pri.ok)
					return pri.msg;
				st.exprTerm = pri.ex;
				st.exprStack = st.exprStack.next;
				st.exprMidStack = st.exprMidStack.next;
			}
			// everything has been applied, and exprTerm has been set!
			if (st.next === null)
				throw new Error('Parser expression expecting to return state');
			st.next.exprTerm = st.exprTerm;
			st.exprTerm = null;
			parser_pop(pr);
			return parser_process(pr, stmts);
	}
}

function parser_add(pr: parser_st, tk: tok_st, stmts: ast_st[]): string | null {
	parser_fwd(pr, tk);
	return parser_process(pr, stmts);
}

function parser_close(pr: parser_st): string | null {
	if (pr.state === null)
		throw new Error('Parser missing state');
	if (pr.state.next !== null)
		return 'Invalid end of file';
	return null;
}

//
// labels
//

interface label_st {
	name: string;
	pos: number;
	rewrites: number[];
}

function label_new(name: string): label_st {
	return {
		name: name,
		pos: -1,
		rewrites: []
	};
}

function label_check(v: any): v is label_st {
	return typeof v === 'object' && v !== null && typeof v.pos === 'number';
}

function label_refresh(lbl: label_st, ops: number[], start: number): void {
	for (let i = start; i < lbl.rewrites.length; i++){
		let index = lbl.rewrites[i];
		ops[index + 0] = lbl.pos % 256;
		ops[index + 1] = (lbl.pos >> 8) % 256;
		ops[index + 2] = (lbl.pos >> 16) % 256;
		ops[index + 3] = (lbl.pos >> 24) % 256;
	}
}

function label_jump(lbl: label_st, ops: number[]): void {
	op_jump(ops, 0xFFFFFFFF, lbl.name);
	lbl.rewrites.push(ops.length - 4);
	if (lbl.pos >= 0)
		label_refresh(lbl, ops, lbl.rewrites.length - 1);
}

function label_jumptrue(lbl: label_st, ops: number[], src: varloc_st): void {
	op_jumptrue(ops, src, 0xFFFFFFFF, lbl.name);
	lbl.rewrites.push(ops.length - 4);
	if (lbl.pos >= 0)
		label_refresh(lbl, ops, lbl.rewrites.length - 1);
}

function label_jumpfalse(lbl: label_st, ops: number[], src: varloc_st): void {
	op_jumpfalse(ops, src, 0xFFFFFFFF, lbl.name);
	lbl.rewrites.push(ops.length - 4);
	if (lbl.pos >= 0)
		label_refresh(lbl, ops, lbl.rewrites.length - 1);
}

function label_call(lbl: label_st, ops: number[], ret: varloc_st, argcount: number): void {
	op_call(ops, ret, 0xFFFFFFFF, argcount, lbl.name);
	lbl.rewrites.push(ops.length - 5);
	if (lbl.pos >= 0)
		label_refresh(lbl, ops, lbl.rewrites.length - 1);
}

function label_returntail(lbl: label_st, ops: number[], argcount: number): void {
	op_returntail(ops, 0xFFFFFFFF, argcount, lbl.name);
	lbl.rewrites.push(ops.length - 5);
	if (lbl.pos >= 0)
		label_refresh(lbl, ops, lbl.rewrites.length - 1);
}

function label_declare(lbl: label_st, ops: number[]): void {
	lbl.pos = ops.length;
	label_refresh(lbl, ops, 0);
}

//
// symbol table
//

enum frame_enum {
	VAR,
	TEMP_INUSE,
	TEMP_AVAIL
}

interface frame_st {
	vars: frame_enum[];
	lbls: label_st[];
	parent: frame_st | null;
	level: number;
}

function frame_new(parent: frame_st | null): frame_st {
	return {
		vars: [],
		lbls: [],
		parent: parent,
		level: parent !== null ? parent.level + 1 : 0
	};
}

enum nsname_enumt {
	VAR,
	ENUM,
	CMD_LOCAL,
	CMD_NATIVE,
	CMD_OPCODE,
	NAMESPACE
}

interface nsname_st_VAR {
	name: string;
	type: nsname_enumt.VAR;
	fr: frame_st;
	index: number;
}
interface nsname_st_ENUM {
	name: string;
	type: nsname_enumt.ENUM;
	val: number;
}
interface nsname_st_CMD_LOCAL {
	name: string;
	type: nsname_enumt.CMD_LOCAL;
	fr: frame_st;
	lbl: label_st;
}
interface nsname_st_CMD_NATIVE {
	name: string;
	type: nsname_enumt.CMD_NATIVE;
	hash: sink_u64;
}
interface nsname_st_CMD_OPCODE {
	name: string;
	type: nsname_enumt.CMD_OPCODE;
	opcode: op_enum;
	params: number;
}
interface nsname_st_NAMESPACE {
	name: string;
	type: nsname_enumt.NAMESPACE;
	ns: namespace_st;
}
type nsname_st = nsname_st_VAR | nsname_st_ENUM | nsname_st_CMD_LOCAL | nsname_st_CMD_NATIVE |
	nsname_st_CMD_OPCODE | nsname_st_NAMESPACE;

function nsname_var(name: string, fr: frame_st, index: number): nsname_st {
	return {
		name: name,
		type: nsname_enumt.VAR,
		fr: fr,
		index: index
	};
}

function nsname_enum(name: string, val: number): nsname_st {
	return {
		name: name,
		type: nsname_enumt.ENUM,
		val: val
	};
}

function nsname_cmdLocal(name: string, fr: frame_st, lbl: label_st): nsname_st {
	return {
		name: name,
		type: nsname_enumt.CMD_LOCAL,
		fr: fr,
		lbl: lbl
	};
}

function nsname_cmdNative(name: string, hash: sink_u64): nsname_st {
	return {
		name: name,
		type: nsname_enumt.CMD_NATIVE,
		hash: hash
	};
}

function nsname_cmdOpcode(name: string, opcode: op_enum, params: number): nsname_st {
	return {
		name: name,
		type: nsname_enumt.CMD_OPCODE,
		opcode: opcode,
		params: params
	};
}

function nsname_namespace(name: string, ns: namespace_st): nsname_st {
	return {
		name: name,
		type: nsname_enumt.NAMESPACE,
		ns: ns
	};
}

interface namespace_st {
	fr: frame_st;
	usings: namespace_st[];
	names: nsname_st[];
}

function namespace_new(fr: frame_st): namespace_st {
	return {
		fr: fr,
		usings: [],
		names: []
	};
}

interface nl_st_FOUND {
	found: true;
	nsn: nsname_st;
}
interface nl_st_NOTFOUND {
	found: false;
}
type nl_st = nl_st_FOUND | nl_st_NOTFOUND;

function nl_found(nsn: nsname_st): nl_st {
	return { found: true, nsn: nsn };
}

function nl_notfound(): nl_st {
	return { found: false };
}

function namespace_lookupLevel(ns: namespace_st, names: string[], start: number,
	tried: namespace_st[]): nl_st {
	for (let nsni = 0; nsni < ns.names.length; nsni++){
		let nsn = ns.names[nsni];
		if (nsn.name === names[start]){
			if (start === names.length - 1) // if we're at the end of names, then report the find
				return nl_found(nsn);
			// otherwise, we need to traverse
			if (nsn.type === nsname_enumt.NAMESPACE)
				return namespace_lookup(nsn.ns, names, start + 1, tried);
			return nl_notfound();
		}
	}
	return nl_notfound();
}

function namespace_getSiblings(ns: namespace_st, res: namespace_st[], tried: namespace_st[]): void {
	if (res.indexOf(ns) >= 0)
		return;
	res.push(ns);
	for (let i = 0; i < ns.usings.length; i++){
		let uns = ns.usings[i];
		if (tried.indexOf(uns) >= 0)
			continue;
		namespace_getSiblings(uns, res, tried);
	}
}

function namespace_lookup(ns: namespace_st, names: string[], start: number,
	tried: namespace_st[]): nl_st {
	if (tried.indexOf(ns) >= 0)
		return nl_notfound();
	tried.push(ns);

	let allns: namespace_st[] = [];
	namespace_getSiblings(ns, allns, tried);
	for (let i = 0; i < allns.length; i++){
		let hns = allns[i];
		let n = namespace_lookupLevel(hns, names, start, tried);
		if (n.found)
			return n;
	}
	return nl_notfound();
}

function namespace_lookupImmediate(ns: namespace_st, names: string[]): nl_st {
	// should perform the most ideal lookup... if it fails, then there is room to add a symbol
	for (let ni = 0; ni < names.length; ni++){
		let name = names[ni];
		let found = false;
		for (let nsni = 0; nsni < ns.names.length; nsni++){
			let nsn = ns.names[nsni];
			if (nsn.name === name){
				if (ni === names.length - 1)
					return nl_found(nsn);
				if (nsn.type !== nsname_enumt.NAMESPACE)
					return nl_notfound();
				ns = nsn.ns;
				found = true;
				break;
			}
		}
		if (!found)
			return nl_notfound();
	}
	return nl_notfound();
}

interface scope_st {
	ns: namespace_st;
	nsStack: namespace_st[];
	lblBreak: label_st | null;
	lblContinue: label_st | null;
	parent: scope_st | null;
}

function scope_new(fr: frame_st, lblBreak: label_st | null, lblContinue: label_st | null,
	parent: scope_st | null): scope_st {
	let ns = namespace_new(fr);
	return {
		ns: ns,
		nsStack: [ns],
		lblBreak: lblBreak,
		lblContinue: lblContinue,
		parent: parent
	};
}

interface symtbl_st {
	fr: frame_st;
	sc: scope_st;
	repl: boolean;
}

function symtbl_new(repl: boolean): symtbl_st {
	let fr = frame_new(null);
	return {
		fr: fr,
		sc: scope_new(fr, null, null, null),
		repl: repl
	};
}

interface sfn_st_OK {
	ok: true;
	ns: namespace_st;
}
interface sfn_st_ERROR {
	ok: false;
	msg: string;
}
type sfn_st = sfn_st_OK | sfn_st_ERROR;

function sfn_ok(ns: namespace_st): sfn_st {
	return { ok: true, ns: ns };
}

function sfn_error(msg: string): sfn_st {
	return { ok: false, msg: msg };
}

function symtbl_findNamespace(sym: symtbl_st, names: string[], max: number): sfn_st {
	let ns = sym.sc.ns;
	for (let ni = 0; ni < max; ni++){
		let name = names[ni];
		let found = false;
		for (let i = 0; i < ns.names.length; i++){
			let nsn = ns.names[i];
			if (nsn.name === name){
				if (nsn.type !== nsname_enumt.NAMESPACE){
					if (!sym.repl)
						return sfn_error('Not a namespace: "' + nsn.name + '"');
					nsn = ns.names[i] = nsname_namespace(nsn.name, namespace_new(ns.fr));
				}
				if (nsn.type !== nsname_enumt.NAMESPACE)
					throw new Error('Symtbl namespace required');
				ns = nsn.ns;
				found = true;
				break;
			}
		}
		if (!found){
			let nns = namespace_new(ns.fr);
			ns.names.push(nsname_namespace(name, nns));
			ns = nns;
		}
	}
	return sfn_ok(ns);
}

function symtbl_pushNamespace(sym: symtbl_st, names: string[] | true): string | null{
	let ns: namespace_st;
	if (names === true){
		// create a unique namespace and use it (via `using`) immediately
		let nsp = sym.sc.ns;
		ns = namespace_new(nsp.fr);
		nsp.names.push(nsname_namespace('.', ns));
		nsp.usings.push(ns);
	}
	else{
		// find (and create if non-existant) namespace
		let nsr = symtbl_findNamespace(sym, names, names.length);
		if (!nsr.ok)
			return nsr.msg;
		ns = nsr.ns;
	}
	sym.sc.nsStack.push(ns);
	sym.sc.ns = ns;
	return null;
}

function symtbl_popNamespace(sym: symtbl_st): void {
	sym.sc.nsStack.pop();
	sym.sc.ns = sym.sc.nsStack[sym.sc.nsStack.length - 1];
}

function symtbl_pushScope(sym: symtbl_st): void {
	sym.sc = scope_new(sym.fr, sym.sc.lblBreak, sym.sc.lblContinue, sym.sc);
}

function symtbl_popScope(sym: symtbl_st): void {
	if (sym.sc.parent === null)
		throw new Error('Cannot pop last scope');
	sym.sc = sym.sc.parent;
}

function symtbl_pushFrame(sym: symtbl_st): void {
	sym.fr = frame_new(sym.fr);
	sym.sc = scope_new(sym.fr, null, null, sym.sc);
}

function symtbl_popFrame(sym: symtbl_st): void {
	if (sym.sc.parent === null || sym.fr.parent === null)
		throw new Error('Cannot pop last frame');
	sym.sc = sym.sc.parent;
	sym.fr = sym.fr.parent;
}

interface stl_st_OK {
	ok: true;
	nsn: nsname_st;
}
interface stl_st_ERROR {
	ok: false;
	msg: string;
}
type stl_st = stl_st_OK | stl_st_ERROR;

function stl_ok(nsn: nsname_st): stl_st {
	return { ok: true, nsn: nsn };
}

function stl_error(msg: string): stl_st {
	return { ok: false, msg: msg };
}

function symtbl_lookupfast(sym: symtbl_st, names: string[]): stl_st {
	let tried: namespace_st[] = [];
	let trysc: scope_st | null = sym.sc;
	while (trysc !== null){
		for (let trynsi = trysc.nsStack.length - 1; trynsi >= 0; trynsi--){
			let tryns = trysc.nsStack[trynsi];
			let n = namespace_lookup(tryns, names, 0, tried);
			if (n.found)
				return stl_ok(n.nsn);
		}
		trysc = trysc.parent;
	}
	return stl_error('');
}

function symtbl_lookup(sym: symtbl_st, names: string[]): stl_st {
	let res = symtbl_lookupfast(sym, names);
	if (!res.ok)
		res.msg = 'Not found: ' + names.join('.');
	return res;
}

interface sta_st_OK {
	ok: true;
	vlc: varloc_st;
}
interface sta_st_ERROR {
	ok: false;
	msg: string;
}
type sta_st = sta_st_OK | sta_st_ERROR;

function sta_ok(vlc: varloc_st): sta_st {
	return { ok: true, vlc: vlc };
}

function sta_error(msg: string): sta_st {
	return { ok: false, msg: msg };
}

function symtbl_addTemp(sym: symtbl_st): sta_st {
	for (let i = 0; i < sym.fr.vars.length; i++){
		if (sym.fr.vars[i] === frame_enum.TEMP_AVAIL){
			sym.fr.vars[i] = frame_enum.TEMP_INUSE;
			return sta_ok(varloc_new(sym.fr.level, i));
		}
	}
	if (sym.fr.vars.length >= 256)
		return sta_error('Too many variables in frame');
	sym.fr.vars.push(frame_enum.TEMP_INUSE);
	return sta_ok(varloc_new(sym.fr.level, sym.fr.vars.length - 1));
}

function symtbl_clearTemp(sym: symtbl_st, vlc: varloc_st): void {
	if (varloc_isnull(vlc))
		throw new Error('Cannot clear a null variable');
	if (vlc.frame === sym.fr.level && sym.fr.vars[vlc.index] === frame_enum.TEMP_INUSE)
		sym.fr.vars[vlc.index] = frame_enum.TEMP_AVAIL;
}

function symtbl_tempAvail(sym: symtbl_st): number {
	let cnt = 256 - sym.fr.vars.length;
	for (let i = 0; i < sym.fr.vars.length; i++){
		if (sym.fr.vars[i] === frame_enum.TEMP_AVAIL)
			cnt++;
	}
	return cnt;
}

function symtbl_addVar(sym: symtbl_st, names: string[], slot: number): sta_st {
	// set `slot` to negative to add variable at next available location
	let nsr = symtbl_findNamespace(sym, names, names.length - 1);
	if (!nsr.ok)
		return sta_error(nsr.msg);
	let ns = nsr.ns;
	for (let i = 0; i < ns.names.length; i++){
		let nsn = ns.names[i];
		if (nsn.name === names[names.length - 1]){
			if (!sym.repl)
				return sta_error('Cannot redefine "' + nsn.name + '"');
			if (nsn.type === nsname_enumt.VAR)
				return sta_ok(varloc_new(nsn.fr.level, nsn.index));
			if (slot < 0){
				slot = sym.fr.vars.length;
				sym.fr.vars.push(frame_enum.VAR);
			}
			if (slot >= 256)
				return sta_error('Too many variables in frame');
			ns.names[i] = nsname_var(names[names.length - 1], sym.fr, slot);
			return sta_ok(varloc_new(sym.fr.level, slot));
		}
	}
	if (slot < 0){
		slot = sym.fr.vars.length;
		sym.fr.vars.push(frame_enum.VAR);
	}
	if (slot >= 256)
		return sta_error('Too many variables in frame');
	ns.names.push(nsname_var(names[names.length - 1], sym.fr, slot));
	return sta_ok(varloc_new(sym.fr.level, slot));
}

function symtbl_addEnum(sym: symtbl_st, names: string[], val: number): string | null{
	let nsr = symtbl_findNamespace(sym, names, names.length - 1);
	if (!nsr.ok)
		return nsr.msg;
	let ns = nsr.ns;
	for (let i = 0; i < ns.names.length; i++){
		let nsn = ns.names[i];
		if (nsn.name === names[names.length - 1]){
			if (!sym.repl)
				return 'Cannot redefine "' + nsn.name + '"';
			ns.names[i] = nsname_enum(names[names.length - 1], val);
			return null;
		}
	}
	ns.names.push(nsname_enum(names[names.length - 1], val));
	return null;
}

function symtbl_reserveVars(sym: symtbl_st, count: number): void {
	// reserves the slots 0 to count-1 for arguments to be passed in for commands
	for (let i = 0; i < count; i++)
		sym.fr.vars.push(frame_enum.VAR);
}

function symtbl_addCmdLocal(sym: symtbl_st, names: string[], lbl: label_st): string | null {
	let nsr = symtbl_findNamespace(sym, names, names.length - 1);
	if (!nsr.ok)
		return nsr.msg;
	let ns = nsr.ns;
	for (let i = 0; i < ns.names.length; i++){
		let nsn = ns.names[i];
		if (nsn.name === names[names.length - 1]){
			if (!sym.repl)
				return 'Cannot redefine "' + nsn.name + '"';
			ns.names[i] = nsname_cmdLocal(names[names.length - 1], sym.fr, lbl);
			return null;
		}
	}
	ns.names.push(nsname_cmdLocal(names[names.length - 1], sym.fr, lbl));
	return null;
}

function symtbl_addCmdNative(sym: symtbl_st, names: string[], hash: sink_u64): string | null {
	let nsr = symtbl_findNamespace(sym, names, names.length - 1);
	if (!nsr.ok)
		return nsr.msg;
	let ns = nsr.ns;
	for (let i = 0; i < ns.names.length; i++){
		let nsn = ns.names[i];
		if (nsn.name === names[names.length - 1]){
			if (!sym.repl)
				return 'Cannot redefine "' + nsn.name + '"';
			ns.names[i] = nsname_cmdNative(names[names.length - 1], hash);
			return null;
		}
	}
	ns.names.push(nsname_cmdNative(names[names.length - 1], hash));
	return null;
}

// symtbl_addCmdOpcode
// can simplify this function because it is only called internally
function SAC(sym: symtbl_st, name: string, opcode: op_enum, params: number): void {
	sym.sc.ns.names.push(nsname_cmdOpcode(name, opcode, params));
}

function SAE(sym: symtbl_st, name: string, val: number): void {
	sym.sc.ns.names.push(nsname_enum(name, val));
}

enum struct_enum {
	U8   =  1,
	U16  =  2,
	UL16 =  3,
	UB16 =  4,
	U32  =  5,
	UL32 =  6,
	UB32 =  7,
	S8   =  8,
	S16  =  9,
	SL16 = 10,
	SB16 = 11,
	S32  = 12,
	SL32 = 13,
	SB32 = 14,
	F32  = 15,
	FL32 = 16,
	FB32 = 17,
	F64  = 18,
	FL64 = 19,
	FB64 = 20
}

function symtbl_loadStdlib(sym: symtbl_st): void {
	SAC(sym, 'say'           , op_enum.SAY            , -1);
	SAC(sym, 'warn'          , op_enum.WARN           , -1);
	SAC(sym, 'ask'           , op_enum.ASK            , -1);
	SAC(sym, 'exit'          , op_enum.EXIT           , -1);
	SAC(sym, 'abort'         , op_enum.ABORT          , -1);
	SAC(sym, 'isnum'         , op_enum.ISNUM          ,  1);
	SAC(sym, 'isstr'         , op_enum.ISSTR          ,  1);
	SAC(sym, 'islist'        , op_enum.ISLIST         ,  1);
	SAC(sym, 'range'         , op_enum.RANGE          ,  3);
	SAC(sym, 'order'         , op_enum.ORDER          ,  2);
	SAC(sym, 'pick'          , op_enum.PICK           ,  3);
	SAC(sym, 'embed'         , op_enum.EMBED          ,  1);
	SAC(sym, 'stacktrace'    , op_enum.STACKTRACE     ,  0);
	symtbl_pushNamespace(sym, ['num']);
		SAC(sym, 'abs'       , op_enum.NUM_ABS        ,  1);
		SAC(sym, 'sign'      , op_enum.NUM_SIGN       ,  1);
		SAC(sym, 'max'       , op_enum.NUM_MAX        , -1);
		SAC(sym, 'min'       , op_enum.NUM_MIN        , -1);
		SAC(sym, 'clamp'     , op_enum.NUM_CLAMP      ,  3);
		SAC(sym, 'floor'     , op_enum.NUM_FLOOR      ,  1);
		SAC(sym, 'ceil'      , op_enum.NUM_CEIL       ,  1);
		SAC(sym, 'round'     , op_enum.NUM_ROUND      ,  1);
		SAC(sym, 'trunc'     , op_enum.NUM_TRUNC      ,  1);
		SAC(sym, 'nan'       , op_enum.NUM_NAN        ,  0);
		SAC(sym, 'inf'       , op_enum.NUM_INF        ,  0);
		SAC(sym, 'isnan'     , op_enum.NUM_ISNAN      ,  1);
		SAC(sym, 'isfinite'  , op_enum.NUM_ISFINITE   ,  1);
		SAE(sym, 'e'         , sink_num_e()               );
		SAE(sym, 'pi'        , sink_num_pi()              );
		SAE(sym, 'tau'       , sink_num_tau()             );
		SAC(sym, 'sin'       , op_enum.NUM_SIN        ,  1);
		SAC(sym, 'cos'       , op_enum.NUM_COS        ,  1);
		SAC(sym, 'tan'       , op_enum.NUM_TAN        ,  1);
		SAC(sym, 'asin'      , op_enum.NUM_ASIN       ,  1);
		SAC(sym, 'acos'      , op_enum.NUM_ACOS       ,  1);
		SAC(sym, 'atan'      , op_enum.NUM_ATAN       ,  1);
		SAC(sym, 'atan2'     , op_enum.NUM_ATAN2      ,  2);
		SAC(sym, 'log'       , op_enum.NUM_LOG        ,  1);
		SAC(sym, 'log2'      , op_enum.NUM_LOG2       ,  1);
		SAC(sym, 'log10'     , op_enum.NUM_LOG10      ,  1);
		SAC(sym, 'exp'       , op_enum.NUM_EXP        ,  1);
		SAC(sym, 'lerp'      , op_enum.NUM_LERP       ,  3);
		SAC(sym, 'hex'       , op_enum.NUM_HEX        ,  2);
		SAC(sym, 'oct'       , op_enum.NUM_OCT        ,  2);
		SAC(sym, 'bin'       , op_enum.NUM_BIN        ,  2);
	symtbl_popNamespace(sym);
	symtbl_pushNamespace(sym, ['int']);
		SAC(sym, 'new'       , op_enum.INT_NEW        ,  1);
		SAC(sym, 'not'       , op_enum.INT_NOT        ,  1);
		SAC(sym, 'and'       , op_enum.INT_AND        , -1);
		SAC(sym, 'or'        , op_enum.INT_OR         , -1);
		SAC(sym, 'xor'       , op_enum.INT_XOR        , -1);
		SAC(sym, 'shl'       , op_enum.INT_SHL        ,  2);
		SAC(sym, 'shr'       , op_enum.INT_SHR        ,  2);
		SAC(sym, 'sar'       , op_enum.INT_SAR        ,  2);
		SAC(sym, 'add'       , op_enum.INT_ADD        ,  2);
		SAC(sym, 'sub'       , op_enum.INT_SUB        ,  2);
		SAC(sym, 'mul'       , op_enum.INT_MUL        ,  2);
		SAC(sym, 'div'       , op_enum.INT_DIV        ,  2);
		SAC(sym, 'mod'       , op_enum.INT_MOD        ,  2);
		SAC(sym, 'clz'       , op_enum.INT_CLZ        ,  1);
		SAC(sym, 'pop'       , op_enum.INT_POP        ,  1);
		SAC(sym, 'bswap'     , op_enum.INT_BSWAP      ,  1);
	symtbl_popNamespace(sym);
	symtbl_pushNamespace(sym, ['rand']);
		SAC(sym, 'seed'      , op_enum.RAND_SEED      ,  1);
		SAC(sym, 'seedauto'  , op_enum.RAND_SEEDAUTO  ,  0);
		SAC(sym, 'int'       , op_enum.RAND_INT       ,  0);
		SAC(sym, 'num'       , op_enum.RAND_NUM       ,  0);
		SAC(sym, 'getstate'  , op_enum.RAND_GETSTATE  ,  0);
		SAC(sym, 'setstate'  , op_enum.RAND_SETSTATE  ,  1);
		SAC(sym, 'pick'      , op_enum.RAND_PICK      ,  1);
		SAC(sym, 'shuffle'   , op_enum.RAND_SHUFFLE   ,  1);
	symtbl_popNamespace(sym);
	symtbl_pushNamespace(sym, ['str']);
		SAC(sym, 'new'       , op_enum.STR_NEW        , -1);
		SAC(sym, 'split'     , op_enum.STR_SPLIT      ,  2);
		SAC(sym, 'replace'   , op_enum.STR_REPLACE    ,  3);
		SAC(sym, 'begins'    , op_enum.STR_BEGINS     ,  2);
		SAC(sym, 'ends'      , op_enum.STR_ENDS       ,  2);
		SAC(sym, 'pad'       , op_enum.STR_PAD        ,  2);
		SAC(sym, 'find'      , op_enum.STR_FIND       ,  3);
		SAC(sym, 'rfind'     , op_enum.STR_RFIND      ,  3);
		SAC(sym, 'lower'     , op_enum.STR_LOWER      ,  1);
		SAC(sym, 'upper'     , op_enum.STR_UPPER      ,  1);
		SAC(sym, 'trim'      , op_enum.STR_TRIM       ,  1);
		SAC(sym, 'rev'       , op_enum.STR_REV        ,  1);
		SAC(sym, 'rep'       , op_enum.STR_REP        ,  2);
		SAC(sym, 'list'      , op_enum.STR_LIST       ,  1);
		SAC(sym, 'byte'      , op_enum.STR_BYTE       ,  2);
		SAC(sym, 'hash'      , op_enum.STR_HASH       ,  2);
	symtbl_popNamespace(sym);
	symtbl_pushNamespace(sym, ['utf8']);
		SAC(sym, 'valid'     , op_enum.UTF8_VALID     ,  1);
		SAC(sym, 'list'      , op_enum.UTF8_LIST      ,  1);
		SAC(sym, 'str'       , op_enum.UTF8_STR       ,  1);
	symtbl_popNamespace(sym);
	symtbl_pushNamespace(sym, ['struct']);
		SAC(sym, 'size'      , op_enum.STRUCT_SIZE    ,  1);
		SAC(sym, 'str'       , op_enum.STRUCT_STR     ,  2);
		SAC(sym, 'list'      , op_enum.STRUCT_LIST    ,  2);
		SAC(sym, 'isLE'      , op_enum.STRUCT_ISLE    ,  0);
		SAE(sym, 'U8'        , struct_enum.U8             );
		SAE(sym, 'U16'       , struct_enum.U16            );
		SAE(sym, 'UL16'      , struct_enum.UL16           );
		SAE(sym, 'UB16'      , struct_enum.UB16           );
		SAE(sym, 'U32'       , struct_enum.U32            );
		SAE(sym, 'UL32'      , struct_enum.UL32           );
		SAE(sym, 'UB32'      , struct_enum.UB32           );
		SAE(sym, 'S8'        , struct_enum.S8             );
		SAE(sym, 'S16'       , struct_enum.S16            );
		SAE(sym, 'SL16'      , struct_enum.SL16           );
		SAE(sym, 'SB16'      , struct_enum.SB16           );
		SAE(sym, 'S32'       , struct_enum.S32            );
		SAE(sym, 'SL32'      , struct_enum.SL32           );
		SAE(sym, 'SB32'      , struct_enum.SB32           );
		SAE(sym, 'F32'       , struct_enum.F32            );
		SAE(sym, 'FL32'      , struct_enum.FL32           );
		SAE(sym, 'FB32'      , struct_enum.FB32           );
		SAE(sym, 'F64'       , struct_enum.F64            );
		SAE(sym, 'FL64'      , struct_enum.FL64           );
		SAE(sym, 'FB64'      , struct_enum.FB64           );
	symtbl_popNamespace(sym);
	symtbl_pushNamespace(sym, ['list']);
		SAC(sym, 'new'       , op_enum.LIST_NEW       ,  2);
		SAC(sym, 'shift'     , op_enum.LIST_SHIFT     ,  1);
		SAC(sym, 'pop'       , op_enum.LIST_POP       ,  1);
		SAC(sym, 'push'      , op_enum.LIST_PUSH      ,  2);
		SAC(sym, 'unshift'   , op_enum.LIST_UNSHIFT   ,  2);
		SAC(sym, 'append'    , op_enum.LIST_APPEND    ,  2);
		SAC(sym, 'prepend'   , op_enum.LIST_PREPEND   ,  2);
		SAC(sym, 'find'      , op_enum.LIST_FIND      ,  3);
		SAC(sym, 'rfind'     , op_enum.LIST_RFIND     ,  3);
		SAC(sym, 'join'      , op_enum.LIST_JOIN      ,  2);
		SAC(sym, 'rev'       , op_enum.LIST_REV       ,  1);
		SAC(sym, 'str'       , op_enum.LIST_STR       ,  1);
		SAC(sym, 'sort'      , op_enum.LIST_SORT      ,  1);
		SAC(sym, 'rsort'     , op_enum.LIST_RSORT     ,  1);
	symtbl_popNamespace(sym);
	symtbl_pushNamespace(sym, ['pickle']);
		SAC(sym, 'json'      , op_enum.PICKLE_JSON    ,  1);
		SAC(sym, 'bin'       , op_enum.PICKLE_BIN     ,  1);
		SAC(sym, 'val'       , op_enum.PICKLE_VAL     ,  1);
		SAC(sym, 'valid'     , op_enum.PICKLE_VALID   ,  1);
		SAC(sym, 'sibling'   , op_enum.PICKLE_SIBLING ,  1);
		SAC(sym, 'circular'  , op_enum.PICKLE_CIRCULAR,  1);
		SAC(sym, 'copy'      , op_enum.PICKLE_COPY    ,  1);
	symtbl_popNamespace(sym);
	symtbl_pushNamespace(sym, ['gc']);
		SAC(sym, 'getlevel'  , op_enum.GC_GETLEVEL    ,  0);
		SAC(sym, 'setlevel'  , op_enum.GC_SETLEVEL    ,  1);
		SAC(sym, 'run'       , op_enum.GC_RUN         ,  0);
	symtbl_popNamespace(sym);
}

//
// structures
//

interface program_st {
	strTable: string[];
	keyTable: sink_u64[];
	debugTable: string[];
	posTable: prgflp_st[];
	cmdTable: prgch_st[];
	ops: number[];
	repl: boolean;
}

enum bis_enum {
	HEADER,
	STR_HEAD,
	STR_BODY,
	KEY,
	DEBUG_HEAD,
	DEBUG_BODY,
	POS,
	CMD,
	OPS,
	DONE
}

interface binstate_st {
	state: bis_enum;
	str_size: number; // strTable
	key_size: number; // keyTable
	dbg_size: number; // debugTable
	pos_size: number; // posTable
	cmd_size: number; // cmdTable
	ops_size: number; // ops
	left: number; // size left to read
	item: number; // item count for the various tables
	buf: string;
}

enum scriptmode_enum {
	UNKNOWN,
	BINARY,
	TEXT
}

interface script_st {
	prg: program_st;
	cmp: compiler_st;
	sinc: staticinc_st;
	files: string[];
	paths: string[];
	inc: sink_inc_st;
	capture_write: string | null;
	curdir: string | null;
	file: string;
	err: string;
	mode: scriptmode_enum;
	binstate: binstate_st;
}

//
// pathjoin
//

function pathjoin(prev: string, next: string): string {
	let p = (prev + '/' + next).split('/');
	let ret = [];
	for (let i = 0; i < p.length; i++){
		if ((i !== 0 && p[i] === '') || p[i] === '.')
			continue;
		if (p[i] === '..')
			ret.pop();
		else
			ret.push(p[i]);
	}
	return ret.join('/');
}

//
// file resolver
//

type f_fileres_begin_f = (file: string, fuser: any) => boolean;
type f_fileres_end_f = (success: boolean, file: string, fuser: any) => void;

function fileres_try(scr: script_st, postfix: boolean, file: string,
	f_begin: f_fileres_begin_f, f_end: f_fileres_end_f, fuser: any): boolean | Promise<boolean> {
	let inc = scr.inc;
	return checkPromise<sink_fstype, boolean>(
		inc.f_fstype(file, inc.user),
		function(fst: sink_fstype): boolean | Promise<boolean> {
			switch (fst){
				case sink_fstype.FILE:
					if (f_begin(file, fuser)){
						return checkPromise<boolean, boolean>(
							inc.f_fsread(scr, file, inc.user),
							function(readRes: boolean): boolean {
								f_end(readRes, file, fuser);
								return true;
							});
					}
					return true;
				case sink_fstype.NONE:
					if (!postfix)
						return false;
					// try adding a .sink extension
					if (file.substr(-5) === '.sink')
						return false;
					return fileres_try(scr, false, file + '.sink', f_begin, f_end, fuser);
				case sink_fstype.DIR:
					if (!postfix)
						return false;
					// try looking for index.sink inside the directory
					return fileres_try(scr, false, pathjoin(file, 'index.sink'), f_begin, f_end, fuser);
			}
			throw new Error('Bad file type');
		}
	);
}

function fileres_read(scr: script_st, postfix: boolean, file: string, cwd: string | null,
	f_begin: f_fileres_begin_f, f_end: f_fileres_end_f, fuser: any): boolean | Promise<boolean> {
	// if an absolute path, there is no searching, so just try to read it directly
	if (file.charAt(0) === '/')
		return fileres_try(scr, postfix, file, f_begin, f_end, fuser);
	// otherwise, we have a relative path, so we need to go through our search list
	if (cwd === null)
		cwd = scr.curdir;
	let paths = scr.paths;
	return nextPath(0);

	function nextPath(i: number): boolean | Promise<boolean> {
		if (i >= paths.length)
			return false;
		let path = paths[i];
		let join: string;
		if (path.charAt(0) === '/') // search path is absolute
			join = pathjoin(path, file);
		else{ // search path is relative
			if (cwd === null)
				return nextPath(i + 1);
			join = pathjoin(pathjoin(cwd, path), file);
		}
		return checkPromise<boolean, boolean>(
			fileres_try(scr, postfix, join, f_begin, f_end, fuser),
			function(found: boolean): boolean | Promise<boolean> {
				if (found)
					return true;
				return nextPath(i + 1);
			}
		);
	}
}

//
// program
//

function program_new(repl: boolean): program_st {
	return {
		strTable: [],
		keyTable: [],
		debugTable: [],
		posTable: [],
		cmdTable: [],
		ops: [],
		repl: repl
	};
}

function program_adddebugstr(prg: program_st, str: string): number {
	for (let i = 0; i < prg.debugTable.length; i++){
		if (prg.debugTable[i] === str)
			return i;
	}
	prg.debugTable.push(str);
	return prg.debugTable.length - 1;
}

function program_addfile(prg: program_st, str: string | null): number {
	if (str === null)
		return -1;
	// get the basename
	let i = str.lastIndexOf('/');
	if (i >= 0)
		str = str.substr(0, i);
	return program_adddebugstr(prg, str);
}

function program_getdebugstr(prg: program_st, str: number): string {
	return str < 0 || str >= prg.debugTable.length ? '' : prg.debugTable[str];
}

function program_errormsg(prg: program_st, flp: filepos_st, msg: string | null): string {
	if (msg === null){
		if (flp.basefile < 0)
			return flp.line + ':' + flp.chr;
		return program_getdebugstr(prg, flp.basefile) + ':' + flp.line + ':' + flp.chr;
	}
	if (flp.basefile < 0)
		return flp.line + ':' + flp.chr + ': ' + msg;
	return program_getdebugstr(prg, flp.basefile) + ':' + flp.line + ':' + flp.chr + ': ' + msg;
}

function program_validate(prg: program_st): boolean {
	let pc = 0;
	let level = 0;
	let wasjump = false;
	let jumploc = 0;
	let jumplocs: number[] = [];
	for (let i = 0; i < 256; i++)
		jumplocs.push(0);
	let ops = prg.ops;
	let A = 0, B = 0, C = 0, D = 0;

	// holds alignment information
	// op_actual: the actual alignment of each byte
	//   0 = invalid target, 1 = valid jump target, 2 = valid call target
	let op_actual: number[] = [];
	for (let i = 0; i < ops.length; i++)
		op_actual.push(0);
	// op_need: the required alignment of each byte
	//   0 = don't care, 1 = valid jump target, 2 = valid call target
	let op_need: number[] = [];
	for (let i = 0; i < ops.length; i++)
		op_need.push(0);

	let goto_fail = false;
	function READVAR(): void {
		if (pc + 2 > ops.length){
			goto_fail = true;
			return;
		}
		A = ops[pc++];
		B = ops[pc++];
		if (A > level){
			goto_fail = true;
			return;
		}
	}

	function READLOC(L: number): void {
		if (pc + 4 > ops.length){
			goto_fail = true;
			return;
		}
		A = ops[pc++];
		B = ops[pc++];
		C = ops[pc++];
		D = ops[pc++];
		jumploc = A + (B << 8) + (C << 16) + ((D << 23) * 2);
		if (jumploc < 0){
			goto_fail = true;
			return;
		}
		if (jumploc < ops.length)
			op_need[jumploc] = L;
	}

	function READDATA(S: number): void {
		if (pc + S > ops.length){
			goto_fail = true;
			return;
		}
		pc += S;
	}

	function READCNT(): void {
		if (pc + 1 > ops.length){
			goto_fail = true;
			return;
		}
		C = ops[pc++];
		for (D = 0; D < C && !goto_fail; D++)
			READVAR();
	}

	function READINDEX(){
		if (pc + 4 > ops.length){
			goto_fail = true;
			return;
		}
		A = ops[pc++];
		B = ops[pc++];
		C = ops[pc++];
		D = ops[pc++];
		A = A + (B << 8) + (C << 16) + ((D << 23) * 2);
	}

	while (pc < ops.length){
		op_actual[pc] = 1;
		let opc = op_paramcat(ops[pc++]);
		switch (opc){
			case op_pcat.INVALID   : return false;

			case op_pcat.STR       : { // [VAR], [INDEX]
				READVAR();
				READINDEX();
				if (A < 0 || A >= prg.strTable.length)
					return false;
			} break;

			case op_pcat.CMDHEAD   : { // LEVEL, RESTPOS
				if (!wasjump)
					return false;
				if (pc + 2 > ops.length)
					return false;
				op_actual[pc - 1] = 2; // valid call target
				if (level > 255)
					return false;
				jumplocs[level++] = jumploc; // save previous jump target
				A = ops[pc++];
				B = ops[pc++];
				if (A !== level)
					return false;
			} break;

			case op_pcat.CMDTAIL   : { //
				if (level <= 0)
					return false;
				if (jumplocs[--level] !== pc) // force jump target to jump over command body
					return false;
			} break;

			case op_pcat.JUMP      : { // [[LOCATION]]
				READLOC(1); // need valid jump target
			} break;

			case op_pcat.VJUMP     : { // [VAR], [[LOCATION]]
				READVAR();
				READLOC(1); // need valid jump target
			} break;

			case op_pcat.CALL      : { // [VAR], [[LOCATION]], ARGCOUNT, [VARS]...
				READVAR();
				READLOC(2); // need valid call target
				READCNT();
			} break;

			case op_pcat.NATIVE    : { // [VAR], [INDEX], ARGCOUNT, [VARS]...
				READVAR();
				READINDEX();
				if (A < 0 || A >= prg.keyTable.length)
					return false;
				READCNT();
			} break;

			case op_pcat.RETURNTAIL: { // [[LOCATION]], ARGCOUNT, [VARS]...
				READLOC(2); // need valid call target
				READCNT();
				if (jumploc < ops.length - 1){
					// check that the call target's level matches this level
					if (ops[jumploc] !== op_enum.CMDHEAD || ops[jumploc + 1] !== level)
						return false;
				}
			} break;

			case op_pcat.VVVV      :   // [VAR], [VAR], [VAR], [VAR]
				READVAR();
			case op_pcat.VVV       :   // [VAR], [VAR], [VAR]
				READVAR();
			case op_pcat.VV        :   // [VAR], [VAR]
				READVAR();
			case op_pcat.V         :   // [VAR]
				READVAR();
			case op_pcat.EMPTY     :   // nothing
				break;

			case op_pcat.VA        : { // [VAR], ARGCOUNT, [VARS]...
				READVAR();
				READCNT();
			} break;

			case op_pcat.VN        : { // [VAR], DATA
				READVAR();
				READDATA(1);
			} break;

			case op_pcat.VNN       : { // [VAR], [DATA]
				READVAR();
				READDATA(2);
			} break;

			case op_pcat.VNNNN     : { // [VAR], [[DATA]]
				READVAR();
				READDATA(4);
			} break;

			case op_pcat.VNNNNNNNN : { // [VAR], [[[DATA]]]
				READVAR();
				READDATA(8);
			} break;
		}
		if (goto_fail)
			return false;
		wasjump = opc === op_pcat.JUMP;
	}
	// validate op_need alignments matches op_actual alignments
	for (let i = 0; i < ops.length; i++){
		if (op_need[i] !== 0 && op_need[i] !== op_actual[i])
			return false;
	}
	return true;
}

interface prgflp_st {
	pc: number;
	flp: filepos_st;
}

function program_flp(prg: program_st, flp: filepos_st): void {
	let i = prg.posTable.length - 1;
	if (i >= 0){
		let p = prg.posTable[i];
		if (p.pc === prg.ops.length){
			p.flp = flp;
			return;
		}
	}
	let p: prgflp_st = { pc: prg.ops.length, flp: flp };
	prg.posTable.push(p);
}

interface prgch_st {
	pc: number;
	cmdhint: number;
}

function program_cmdhint(prg: program_st, names: string[] | null): void {
	let p: prgch_st = { pc: prg.ops.length, cmdhint: -1 };
	if (names !== null)
		p.cmdhint = program_adddebugstr(prg, names.join('.'))
	prg.cmdTable.push(p);
}

interface pgen_st {
	prg: program_st;
	sym: symtbl_st;
	scr: script_st;
	from: number;
}

interface per_st_OK {
	ok: true;
	vlc: varloc_st;
}
interface per_st_ERROR {
	ok: false;
	flp: filepos_st;
	msg: string;
}
type per_st = per_st_OK | per_st_ERROR;

function per_ok(vlc: varloc_st): per_st {
	return { ok: true, vlc: vlc };
}

function per_error(flp: filepos_st, msg: string): per_st {
	return { ok: false, flp: flp, msg: msg };
}

enum pem_enum {
	EMPTY,  // I don't need the value
	CREATE, // I need to read the value
	INTO    // I need to own the register
}

interface psr_st_OK {
	ok: true;
	start: varloc_st;
	len: varloc_st;
}
interface psr_st_ERROR {
	ok: false;
	flp: filepos_st;
	msg: string;
}
type psr_st = psr_st_OK | psr_st_ERROR;

function psr_ok(start: varloc_st, len: varloc_st): psr_st {
	return { ok: true, start: start, len: len };
}

function psr_error(flp: filepos_st, msg: string): psr_st {
	return { ok: false, flp: flp, msg: msg };
}

enum lvr_enum {
	VAR,
	INDEX,
	SLICE,
	SLICEINDEX,
	LIST
}

interface lvr_st_VAR {
	flp: filepos_st;
	vlc: varloc_st;
	type: lvr_enum.VAR;
}
interface lvr_st_INDEX {
	flp: filepos_st;
	vlc: varloc_st;
	type: lvr_enum.INDEX;
	obj: varloc_st;
	key: varloc_st;
}
interface lvr_st_SLICE {
	flp: filepos_st;
	vlc: varloc_st;
	type: lvr_enum.SLICE;
	obj: varloc_st;
	start: varloc_st;
	len: varloc_st;
}
interface lvr_st_SLICEINDEX {
	flp: filepos_st;
	vlc: varloc_st;
	type: lvr_enum.SLICEINDEX;
	indexvlc: varloc_st;
	obj: varloc_st;
	key: varloc_st;
	start: varloc_st;
	len: varloc_st;
}
interface lvr_st_LIST {
	flp: filepos_st;
	vlc: varloc_st;
	type: lvr_enum.LIST;
	body: lvr_st[];
	rest: lvr_st | null;
}
type lvr_st = lvr_st_VAR | lvr_st_INDEX | lvr_st_SLICE | lvr_st_SLICEINDEX | lvr_st_LIST;

function lvr_var(flp: filepos_st, vlc: varloc_st): lvr_st {
	return { flp: flp, vlc: vlc, type: lvr_enum.VAR };
}

function lvr_index(flp: filepos_st, obj: varloc_st, key: varloc_st): lvr_st {
	return { flp: flp, vlc: VARLOC_NULL, type: lvr_enum.INDEX, obj: obj, key: key };
}

function lvr_slice(flp: filepos_st, obj: varloc_st, start: varloc_st, len: varloc_st): lvr_st {
	return { flp: flp, vlc: VARLOC_NULL, type: lvr_enum.SLICE, obj: obj, start: start, len: len };
}

function lvr_sliceindex(flp: filepos_st, obj: varloc_st, key: varloc_st, start: varloc_st,
	len: varloc_st): lvr_st {
	return {
		flp: flp,
		vlc: VARLOC_NULL,
		type: lvr_enum.SLICEINDEX,
		indexvlc: VARLOC_NULL,
		obj: obj,
		key: key,
		start: start,
		len: len
	};
}

function lvr_list(flp: filepos_st, body: lvr_st[], rest: lvr_st | null): lvr_st {
	return { flp: flp, vlc: VARLOC_NULL, type: lvr_enum.LIST, body: body, rest: rest };
}

enum plm_enum {
	CREATE,
	INTO
}

interface lvp_st_OK {
	ok: true;
	lv: lvr_st;
}
interface lvp_st_ERROR {
	ok: false;
	flp: filepos_st;
	msg: string;
}
type lvp_st = lvp_st_OK | lvp_st_ERROR;

function lvp_ok(lv: lvr_st): lvp_st {
	return { ok: true, lv: lv };
}

function lvp_error(flp: filepos_st, msg: string): lvp_st {
	return { ok: false, flp: flp, msg: msg };
}

function lval_addVars(sym: symtbl_st, ex: expr_st, slot: number): lvp_st {
	if (ex.type === expr_enum.NAMES){
		let sr = symtbl_addVar(sym, ex.names, slot);
		if (!sr.ok)
			return lvp_error(ex.flp, sr.msg);
		return lvp_ok(lvr_var(ex.flp, sr.vlc));
	}
	else if (ex.type === expr_enum.LIST){
		if (ex.ex === null)
			return lvp_error(ex.flp, 'Invalid assignment');
		let body: lvr_st[] = [];
		let rest: lvr_st | null = null;
		if (ex.ex.type === expr_enum.GROUP){
			for (let i = 0; i < ex.ex.group.length; i++){
				let gex = ex.ex.group[i];
				if (i === ex.ex.group.length - 1 && gex.type === expr_enum.PREFIX &&
					gex.k === ks_enum.PERIOD3){
					let lp = lval_addVars(sym, gex.ex, -1);
					if (!lp.ok)
						return lp;
					rest = lp.lv;
				}
				else{
					let lp = lval_addVars(sym, gex, -1);
					if (!lp.ok)
						return lp;
					body.push(lp.lv);
				}
			}
		}
		else if (ex.ex.type === expr_enum.PREFIX && ex.ex.k === ks_enum.PERIOD3){
			let lp = lval_addVars(sym, ex.ex.ex, -1);
			if (!lp.ok)
				return lp;
			rest = lp.lv;
		}
		else{
			let lp = lval_addVars(sym, ex.ex, -1);
			if (!lp.ok)
				return lp;
			body.push(lp.lv);
		}
		return lvp_ok(lvr_list(ex.flp, body, rest));
	}
	return lvp_error(ex.flp, 'Invalid assignment');
}

function lval_prepare(pgen: pgen_st, ex: expr_st): lvp_st | Promise<lvp_st> {


	function handleListGroup(flp: filepos_st, exg: expr_st_GROUP): lvp_st | Promise<lvp_st> {
		let body: lvr_st[] = [];
		let rest: lvr_st | null = null;
		function handleNext(i: number): lvp_st | Promise<lvp_st> {
			if (i >= exg.group.length)
				return lvp_ok(lvr_list(flp, body, rest));

			let gex = exg.group[i];
			if (i === exg.group.length - 1 && gex.type === expr_enum.PREFIX &&
				gex.k === ks_enum.PERIOD3){
				return checkPromise<lvp_st, lvp_st>(
					lval_prepare(pgen, gex.ex),
					function(lp: lvp_st): lvp_st | Promise<lvp_st> {
						if (!lp.ok)
							return lp;
						rest = lp.lv;
						return handleNext(i + 1);
					}
				);
			}
			else{
				return checkPromise<lvp_st, lvp_st>(
					lval_prepare(pgen, gex),
					function(lp: lvp_st): lvp_st | Promise<lvp_st> {
						if (!lp.ok)
							return lp;
						body.push(lp.lv);
						return handleNext(i + 1);
					}
				);
			}
		}
		return handleNext(0);
	}

	function handleListRest(flp: filepos_st, exr: expr_st): lvp_st | Promise<lvp_st> {
		return checkPromise<lvp_st, lvp_st>(
			lval_prepare(pgen, exr),
			function(lp: lvp_st): lvp_st {
				if (!lp.ok)
					return lp;
				return lvp_ok(lvr_list(flp, [], lp.lv));
			}
		);
	}

	function handleListBody(flp: filepos_st, exb: expr_st): lvp_st | Promise<lvp_st> {
		return checkPromise<lvp_st, lvp_st>(
			lval_prepare(pgen, exb),
			function(lp: lvp_st): lvp_st {
				if (!lp.ok)
					return lp;
				return lvp_ok(lvr_list(flp, [lp.lv], null));
			}
		);
	}

	if (ex.type === expr_enum.NAMES){
		let sl = symtbl_lookup(pgen.sym, ex.names);
		if (!sl.ok)
			return lvp_error(ex.flp, sl.msg);
		if (sl.nsn.type !== nsname_enumt.VAR)
			return lvp_error(ex.flp, 'Invalid assignment');
		return lvp_ok(lvr_var(ex.flp, varloc_new(sl.nsn.fr.level, sl.nsn.index)));
	}
	else if (ex.type === expr_enum.INDEX){
		return checkPromise<per_st, lvp_st>(
			program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.obj),
			function handleIndex(pe: per_st): lvp_st | Promise<lvp_st> {
				if (!pe.ok)
					return lvp_error(pe.flp, pe.msg);
				let obj = pe.vlc;

				if (ex.type !== expr_enum.INDEX)
					throw new Error('Expression type must be index');
				return checkPromise<per_st, lvp_st>(
					program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.key),
					function(pe: per_st): lvp_st {
						if (!pe.ok)
							return lvp_error(pe.flp, pe.msg);
						return lvp_ok(lvr_index(ex.flp, obj, pe.vlc));
					}
				);
			}
		);
	}
	else if (ex.type === expr_enum.SLICE){
		if (ex.obj.type === expr_enum.INDEX){
			// we have a slice of an index `foo[1][2:3]`
			return checkPromise<per_st, lvp_st>(
				program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.obj.obj),
				function(pe: per_st): lvp_st | Promise<lvp_st> {
					if (!pe.ok)
						return lvp_error(pe.flp, pe.msg);
					let obj = pe.vlc;

					if (ex.type !== expr_enum.SLICE || ex.obj.type !== expr_enum.INDEX)
						throw new Error('Expression type must be a slice index');
					return checkPromise<per_st, lvp_st>(
						program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.obj.key),
						function(pe: per_st): lvp_st | Promise<lvp_st> {
							if (!pe.ok)
								return lvp_error(pe.flp, pe.msg);
							let key = pe.vlc;

							function fixex(ex: expr_st): expr_st_SLICE {
								if (ex.type !== expr_enum.SLICE)
									throw new Error('Expression type must be slice');
								return ex;
							}
							return checkPromise<psr_st, lvp_st>(
								program_slice(pgen, fixex(ex)),
								function(sr: psr_st): lvp_st {
									if (!sr.ok)
										return lvp_error(sr.flp, sr.msg);
									return lvp_ok(lvr_sliceindex(ex.flp, obj, key, sr.start, sr.len));
								}
							);
						}
					);
				}
			);
		}
		else{
			return checkPromise<per_st, lvp_st>(
				program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.obj),
				function(pe: per_st): lvp_st | Promise<lvp_st> {
					if (!pe.ok)
						return lvp_error(pe.flp, pe.msg);
					let obj = pe.vlc;

					function fixex(ex: expr_st): expr_st_SLICE {
						if (ex.type !== expr_enum.SLICE)
							throw new Error('Expression type must be slice');
						return ex;
					}
					return checkPromise<psr_st, lvp_st>(
						program_slice(pgen, fixex(ex)),
						function(sr: psr_st): lvp_st {
							if (!sr.ok)
								return lvp_error(sr.flp, sr.msg);
							return lvp_ok(lvr_slice(ex.flp, obj, sr.start, sr.len));
						}
					);
				}
			);
		}
	}
	else if (ex.type === expr_enum.LIST){
		if (ex.ex === null)
			return lvp_error(ex.flp, 'Invalid assignment');
		else if (ex.ex.type === expr_enum.GROUP)
			return handleListGroup(ex.flp, ex.ex);
		else{
			if (ex.ex.type === expr_enum.PREFIX && ex.ex.k === ks_enum.PERIOD3)
				return handleListRest(ex.flp, ex.ex.ex);
			else
				return handleListBody(ex.flp, ex.ex);
		}
	}
	return lvp_error(ex.flp, 'Invalid assignment');
}

function lval_clearTemps(lv: lvr_st, sym: symtbl_st): void {
	if (lv.type !== lvr_enum.VAR && !varloc_isnull(lv.vlc)){
		symtbl_clearTemp(sym, lv.vlc);
		lv.vlc = VARLOC_NULL;
	}
	switch (lv.type){
		case lvr_enum.VAR:
			return;
		case lvr_enum.INDEX:
			symtbl_clearTemp(sym, lv.obj);
			symtbl_clearTemp(sym, lv.key);
			return;
		case lvr_enum.SLICE:
			symtbl_clearTemp(sym, lv.obj);
			symtbl_clearTemp(sym, lv.start);
			symtbl_clearTemp(sym, lv.len);
			return;
		case lvr_enum.SLICEINDEX:
			if (!varloc_isnull(lv.indexvlc)){
				symtbl_clearTemp(sym, lv.indexvlc);
				lv.indexvlc = VARLOC_NULL;
			}
			symtbl_clearTemp(sym, lv.obj);
			symtbl_clearTemp(sym, lv.key);
			symtbl_clearTemp(sym, lv.start);
			symtbl_clearTemp(sym, lv.len);
			return;
		case lvr_enum.LIST:
			for (let i = 0; i < lv.body.length; i++)
				lval_clearTemps(lv.body[i], sym);
			if (lv.rest !== null)
				lval_clearTemps(lv.rest, sym);
			return;
	}
}

function program_evalLval(pgen: pgen_st, mode: pem_enum, intoVlc: varloc_st, lv: lvr_st,
	mutop: op_enum, valueVlc: varloc_st, clearTemps: boolean): per_st {
	let prg = pgen.prg;
	let sym = pgen.sym;
	// first, perform the assignment of valueVlc into lv
	switch (lv.type){
		case lvr_enum.VAR:
			if (mutop === op_enum.INVALID)
				op_move(prg.ops, lv.vlc, valueVlc);
			else
				op_binop(prg.ops, mutop, lv.vlc, lv.vlc, valueVlc);
			break;

		case lvr_enum.INDEX: {
			if (mutop === op_enum.INVALID)
				op_setat(prg.ops, lv.obj, lv.key, valueVlc);
			else{
				let pe = program_lvalGet(pgen, plm_enum.CREATE, VARLOC_NULL, lv);
				if (!pe.ok)
					return pe;
				op_binop(prg.ops, mutop, pe.vlc, pe.vlc, valueVlc);
				op_setat(prg.ops, lv.obj, lv.key, pe.vlc);
			}
		} break;

		case lvr_enum.SLICE: {
			if (mutop === op_enum.INVALID)
				op_splice(prg.ops, lv.obj, lv.start, lv.len, valueVlc);
			else{
				let pe = program_lvalGet(pgen, plm_enum.CREATE, VARLOC_NULL, lv);
				if (!pe.ok)
					return pe;
				let lv2 = lvr_var(lv.flp, lv.vlc);
				pe = program_evalLval(pgen, pem_enum.EMPTY, VARLOC_NULL, lv2, mutop, valueVlc,
					true);
				if (!pe.ok)
					return pe;
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(lv.flp, ts.msg);
				let t = ts.vlc;
				op_numint(prg.ops, t, 0);
				op_slice(prg.ops, t, lv.vlc, t, lv.len);
				op_splice(prg.ops, lv.obj, lv.start, lv.len, t);
				symtbl_clearTemp(sym, t);
				symtbl_clearTemp(sym, lv.vlc);
				lv.vlc = VARLOC_NULL;
			}
		} break;

		case lvr_enum.SLICEINDEX: {
			if (mutop === op_enum.INVALID){
				let pe = program_lvalGetIndex(pgen, lv);
				if (!pe.ok)
					return pe;
				op_splice(prg.ops, pe.vlc, lv.start, lv.len, valueVlc);
				op_setat(prg.ops, lv.obj, lv.key, pe.vlc);
			}
			else{
				let pe = program_lvalGet(pgen, plm_enum.CREATE, VARLOC_NULL, lv);
				if (!pe.ok)
					return pe;
				let lv2 = lvr_var(lv.flp, lv.vlc);
				pe = program_evalLval(pgen, pem_enum.EMPTY, VARLOC_NULL, lv2, mutop, valueVlc,
					true);
				if (!pe.ok)
					return pe;
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(lv.flp, ts.msg);
				let t = ts.vlc;
				op_numint(prg.ops, t, 0);
				op_slice(prg.ops, t, lv.vlc, t, lv.len);
				op_splice(prg.ops, lv.indexvlc, lv.start, lv.len, t);
				symtbl_clearTemp(sym, t);
				symtbl_clearTemp(sym, lv.indexvlc);
				symtbl_clearTemp(sym, lv.vlc);
				lv.indexvlc = VARLOC_NULL;
				lv.vlc = VARLOC_NULL;
			}
		} break;

		case lvr_enum.LIST: {
			let ts = symtbl_addTemp(sym);
			if (!ts.ok)
				return per_error(lv.flp, ts.msg);
			let t = ts.vlc;

			for (let i = 0; i < lv.body.length; i++){
				op_numint(prg.ops, t, i);
				op_getat(prg.ops, t, valueVlc, t);
				let pe = program_evalLval(pgen, pem_enum.EMPTY, VARLOC_NULL, lv.body[i], mutop, t,
					false);
				if (!pe.ok)
					return pe;
			}

			if (lv.rest !== null){
				ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(lv.flp, ts.msg);
				let t2 = ts.vlc;

				op_numint(prg.ops, t, lv.body.length);
				op_nil(prg.ops, t2);
				op_slice(prg.ops, t, valueVlc, t, t2);
				symtbl_clearTemp(sym, t2);
				let pe = program_evalLval(pgen, pem_enum.EMPTY, VARLOC_NULL, lv.rest, mutop, t,
					false);
				if (!pe.ok)
					return pe;
			}
			symtbl_clearTemp(sym, t);
		} break;
	}

	// now, see if we need to put the result into anything
	if (mode === pem_enum.EMPTY){
		if (clearTemps)
			lval_clearTemps(lv, sym);
		return per_ok(VARLOC_NULL);
	}
	else if (mode === pem_enum.CREATE){
		let ts = symtbl_addTemp(sym);
		if (!ts.ok)
			return per_error(lv.flp, ts.msg);
		intoVlc = ts.vlc;
	}

	let pe = program_lvalGet(pgen, plm_enum.INTO, intoVlc, lv);
	if (!pe.ok)
		return pe;
	if (clearTemps)
		lval_clearTemps(lv, sym);
	return per_ok(intoVlc);
}

function program_slice(pgen: pgen_st, ex: expr_st_SLICE): psr_st | Promise<psr_st> {
	if (ex.start === null){
		let ts = symtbl_addTemp(pgen.sym);
		if (!ts.ok)
			return psr_error(ex.flp, ts.msg);
		op_numint(pgen.prg.ops, ts.vlc, 0);
		return gotStart(ts.vlc);
	}
	else{
		return checkPromise<per_st, psr_st>(
			program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.start),
			function(pe: per_st): psr_st | Promise<psr_st> {
				if (!pe.ok)
					return psr_error(pe.flp, pe.msg);
				return gotStart(pe.vlc);
			}
		);
	}
	function gotStart(start: varloc_st): psr_st | Promise<psr_st> {
		if (ex.len === null){
			let ts = symtbl_addTemp(pgen.sym);
			if (!ts.ok)
				return psr_error(ex.flp, ts.msg);
			let len = ts.vlc;
			op_nil(pgen.prg.ops, len);
			return psr_ok(start, len);
		}
		else{
			return checkPromise<per_st, psr_st>(
				program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.len),
				function(pe: per_st): psr_st {
					if (!pe.ok)
						return psr_error(pe.flp, pe.msg);
					return psr_ok(start, pe.vlc);
				}
			);
		}
	}
}

function program_lvalGetIndex(pgen: pgen_st, lv: lvr_st_SLICEINDEX): per_st {
	// specifically for lvr_enum.SLICEINDEX in order to fill lv.indexvlc
	if (!varloc_isnull(lv.indexvlc))
		return per_ok(lv.indexvlc);

	let ts = symtbl_addTemp(pgen.sym);
	if (!ts.ok)
		return per_error(lv.flp, ts.msg);
	lv.indexvlc = ts.vlc;

	op_getat(pgen.prg.ops, lv.indexvlc, lv.obj, lv.key);
	return per_ok(lv.indexvlc);
}

function program_lvalGet(pgen: pgen_st, mode: plm_enum, intoVlc: varloc_st, lv: lvr_st): per_st {
	let prg = pgen.prg;
	if (!varloc_isnull(lv.vlc)){
		if (mode === plm_enum.CREATE)
			return per_ok(lv.vlc);
		op_move(prg.ops, intoVlc, lv.vlc);
		return per_ok(intoVlc);
	}

	if (mode === plm_enum.CREATE){
		let ts = symtbl_addTemp(pgen.sym);
		if (!ts.ok)
			return per_error(lv.flp, ts.msg);
		intoVlc = lv.vlc = ts.vlc;
	}

	switch (lv.type){
		case lvr_enum.VAR:
			throw new Error('Lvalue expected to be in variable already');

		case lvr_enum.INDEX:
			op_getat(prg.ops, intoVlc, lv.obj, lv.key);
			break;

		case lvr_enum.SLICE:
			op_slice(prg.ops, intoVlc, lv.obj, lv.start, lv.len);
			break;

		case lvr_enum.SLICEINDEX: {
			let pe = program_lvalGetIndex(pgen, lv);
			if (!pe.ok)
				return pe;
			op_slice(prg.ops, intoVlc, pe.vlc, lv.start, lv.len);
		} break;

		case lvr_enum.LIST: {
			op_list(prg.ops, intoVlc, lv.body.length);

			for (let i = 0; i < lv.body.length; i++){
				let pe = program_lvalGet(pgen, plm_enum.CREATE, VARLOC_NULL, lv.body[i]);
				if (!pe.ok)
					return pe;
				op_param2(prg.ops, op_enum.LIST_PUSH, intoVlc, intoVlc, pe.vlc);
			}

			if (lv.rest !== null){
				let pe = program_lvalGet(pgen, plm_enum.CREATE, VARLOC_NULL, lv.rest);
				if (!pe.ok)
					return pe;
				op_param2(prg.ops, op_enum.LIST_APPEND, intoVlc, intoVlc, pe.vlc);
			}
		} break;
	}

	return per_ok(intoVlc);
}

function program_evalCallArgcount(pgen: pgen_st, params: expr_st | null, argcount: number[],
	pe: per_st[], p: varloc_st[]): boolean | Promise<boolean> {
	// `p` is an array of 255 varloc_st's, which get filled with `argcount` arguments
	// returns false on error, with error inside of `pe`
	// `argcount` is a single-element array, so values can be written out to caller
	// `pe` is a single-element array, so values can be written out to caller
	argcount[0] = 0;
	if (params === null)
		return true;

	function handleGroup(group: expr_st[]): boolean | Promise<boolean> {
		function handleNext(i: number): boolean | Promise<boolean> {
			if (i >= group.length)
				return true;
			return checkPromise<per_st, boolean>(
				program_eval(pgen, i < argcount[0] ? pem_enum.CREATE : pem_enum.EMPTY,
					VARLOC_NULL, group[i]),
				function(pe0: per_st): boolean | Promise<boolean> {
					pe[0] = pe0;
					if (!pe0.ok)
						return false;
					if (i < argcount[0])
						p[i] = pe0.vlc;
					return handleNext(i + 1);
				}
			);
		}
		return handleNext(0);
	}

	if (params.type === expr_enum.GROUP){
		argcount[0] = params.group.length;
		if (argcount[0] > 254)
			argcount[0] = 254;
		return handleGroup(params.group);
	}
	else{
		argcount[0] = 1;
		return checkPromise<per_st, boolean>(
			program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, params),
			function(pe0: per_st): boolean {
				pe[0] = pe0;
				if (!pe0.ok)
					return false;
				p[0] = pe0.vlc;
				return true;
			}
		);
	}
}

interface efu_st {
	pgen: pgen_st;
	mode: pem_enum;
	intoVlc: varloc_st;
	flp: filepos_st;
	pe: per_st;
}

function embed_begin(file: string, efu: efu_st): boolean {
	// in order to capture the `sink_scr_write`, we need to set `capture_write`
	efu.pgen.scr.capture_write = '';
	return true;
}

function embed_end(success: boolean, file: string, efu: efu_st): void {
	if (success){
		// convert the data into a string expression, then load it
		if (efu.pgen.scr.capture_write === null)
			throw new Error('Bad embed capture');
		let ex = expr_str(efu.flp, efu.pgen.scr.capture_write);
		let pe = program_eval(efu.pgen, efu.mode, efu.intoVlc, ex);
		if (isPromise<per_st>(pe))
			throw new Error('Embed cannot result in an asynchronous string');
		efu.pe = pe;
	}
	else
		efu.pe = per_error(efu.flp, 'Failed to read file for `embed`: ' + file);
	efu.pgen.scr.capture_write = null;
}

interface pen_st_OK {
	ok: true;
	value: number;
}
interface pen_st_ERROR {
	ok: false;
	msg: string;
}
type pen_st = pen_st_OK | pen_st_ERROR;

function pen_ok(value: number): pen_st {
	return { ok: true, value: value };
}

function pen_error(msg: string): pen_st {
	return { ok: false, msg: msg };
}

function program_evalCall(pgen: pgen_st, mode: pem_enum, intoVlc: varloc_st, flp: filepos_st,
	nsn: nsname_st, params: expr_st | null): per_st | Promise<per_st> {
	let prg = pgen.prg;
	let sym = pgen.sym;

	if (nsn.type !== nsname_enumt.CMD_LOCAL && nsn.type !== nsname_enumt.CMD_NATIVE &&
		nsn.type !== nsname_enumt.CMD_OPCODE)
		return per_error(flp, 'Invalid call - not a command');

	// params can be NULL to indicate emptiness
	if (nsn.type === nsname_enumt.CMD_OPCODE && nsn.opcode === op_enum.PICK){
		if (params === null || params.type !== expr_enum.GROUP ||
			params.group.length !== 3)
			return per_error(flp, 'Using `pick` requires exactly three arguments');

		return checkPromise<per_st, per_st>(
			program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, params.group[0]),
			function(pe: per_st): per_st | Promise<per_st> {
				if (!pe.ok)
					return pe;
				if (mode === pem_enum.CREATE){
					let ts = symtbl_addTemp(sym);
					if (!ts.ok)
						return per_error(flp, ts.msg);
					intoVlc = ts.vlc;
				}

				let pickfalse = label_new('^pickfalse');
				let finish = label_new('^pickfinish');

				label_jumpfalse(pickfalse, prg.ops, pe.vlc);
				symtbl_clearTemp(sym, pe.vlc);

				let pe2: per_st | Promise<per_st>;
				if (params === null || params.type !== expr_enum.GROUP)
					throw new Error('Bad params for pick');
				if (mode === pem_enum.EMPTY)
					pe2 = program_eval(pgen, pem_enum.EMPTY, intoVlc, params.group[1]);
				else
					pe2 = program_eval(pgen, pem_enum.INTO, intoVlc, params.group[1]);
				return checkPromise<per_st, per_st>(
					pe2,
					function(pe: per_st): per_st | Promise<per_st> {
						if (!pe.ok)
							return pe;
						label_jump(finish, prg.ops);

						label_declare(pickfalse, prg.ops);
						let pe2: per_st | Promise<per_st>;
						if (params === null || params.type !== expr_enum.GROUP)
							throw new Error('Bad params for pick');
						if (mode === pem_enum.EMPTY)
							pe2 = program_eval(pgen, pem_enum.EMPTY, intoVlc, params.group[2]);
						else
							pe2 = program_eval(pgen, pem_enum.INTO, intoVlc, params.group[2]);
						return checkPromise<per_st, per_st>(
							pe2,
							function(pe: per_st): per_st {
								if (!pe.ok)
									return pe;

								label_declare(finish, prg.ops);
								return per_ok(intoVlc);
							}
						);
					}
				);
			}
		);
	}
	else if (nsn.type === nsname_enumt.CMD_OPCODE && nsn.opcode === op_enum.EMBED){
		let file = params;
		while (file !== null && file.type === expr_enum.PAREN)
			file = file.ex;
		if (file === null || file.type !== expr_enum.STR)
			return per_error(flp, 'Expecting constant string for `embed`');
		let cwd: string | null = null;
		let efu: efu_st = {
			pgen: pgen,
			mode: mode,
			intoVlc: intoVlc,
			flp: flp,
			pe: per_ok(VARLOC_NULL)
		};
		if (pgen.from >= 0)
			cwd = pathjoin(script_getfile(pgen.scr, pgen.from), '..');
		let fstr = file.str;
		return checkPromise<boolean, per_st>(
			fileres_read(pgen.scr, false, fstr, cwd, embed_begin, embed_end, efu),
			function(res: boolean): per_st {
				if (!res)
					return per_error(flp, 'Failed to embed: ' + fstr);
				return efu.pe;
			}
		);
	}
	else if (nsn.type === nsname_enumt.CMD_OPCODE && nsn.opcode === op_enum.STR_HASH &&
		params !== null){
		// attempt to str.hash at compile-time if possible
		let str: string | null = null;
		let seed = 0;
		let ex = params;
		if (ex.type === expr_enum.GROUP && ex.group.length === 2){
			let ex2 = ex.group[1];
			ex = ex.group[0];
			while (ex.type === expr_enum.PAREN)
				ex = ex.ex;
			if (ex.type === expr_enum.STR){
				let p = program_exprToNum(pgen, ex2);
				if (p.ok){
					str = ex.str;
					seed = p.value;
				}
			}
		}
		else{
			while (ex.type === expr_enum.PAREN)
				ex = ex.ex;
			if (ex.type === expr_enum.STR)
				str = ex.str;
		}
		if (str !== null){
			// we can perform a static hash!
			let out = sink_str_hashplain(str, seed);
			let ex = expr_list(flp, expr_group(flp, expr_group(flp, expr_group(flp,
				expr_num(flp, out[0]),
				expr_num(flp, out[1])),
				expr_num(flp, out[2])),
				expr_num(flp, out[3])));
			let p = program_eval(pgen, mode, intoVlc, ex);
			if (isPromise<per_st>(p))
				throw new Error('Expecting synchronous expression for compile-time hash');
			return p;
		}
	}

	if (mode === pem_enum.EMPTY || mode === pem_enum.CREATE){
		let ts = symtbl_addTemp(sym);
		if (!ts.ok)
			return per_error(flp, ts.msg);
		intoVlc = ts.vlc;
	}

	let p: varloc_st[] = [];
	for (let i = 0; i < 256; i++)
		p.push(VARLOC_NULL);
	let argcount: number[] = [0];
	let pe: per_st[] = [per_ok(VARLOC_NULL)];
	if (!program_evalCallArgcount(pgen, params, argcount, pe, p))
		return pe[0];

	program_flp(prg, flp);
	let oarg = true;
	if (nsn.type === nsname_enumt.CMD_LOCAL)
		label_call(nsn.lbl, prg.ops, intoVlc, argcount[0]);
	else if (nsn.type === nsname_enumt.CMD_NATIVE){
		// search for the hash
		let index = 0;
		let found = false;
		for ( ; index < prg.keyTable.length; index++){
			if (prg.keyTable[index] === nsn.hash){ // TODO: sink_u64 equ
				found = true;
				break;
			}
		}
		if (!found){
			if (prg.keyTable.length >= 0x7FFFFFFF) // using too many native calls?
				return per_error(flp, 'Too many native commands');
			index = prg.keyTable.length;
			prg.keyTable.push(nsn.hash);
		}
		op_native(prg.ops, intoVlc, index, argcount[0]);
	}
	else{ // nsname_enumt.CMD_OPCODE
		if (nsn.params < 0)
			op_parama(prg.ops, nsn.opcode, intoVlc, argcount[0]);
		else{
			oarg = false;
			if (nsn.params > argcount[0]){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(flp, ts.msg);
				p[argcount[0] + 0] = p[argcount[0] + 1] = p[argcount[0] + 2] = ts.vlc;
				op_nil(prg.ops, p[argcount[0]]);
				argcount[0]++;
			}
			if (nsn.params === 0)
				op_param0(prg.ops, nsn.opcode, intoVlc);
			else if (nsn.params === 1)
				op_param1(prg.ops, nsn.opcode, intoVlc, p[0]);
			else if (nsn.params === 2)
				op_param2(prg.ops, nsn.opcode, intoVlc, p[0], p[1]);
			else // nsn.params === 3
				op_param3(prg.ops, nsn.opcode, intoVlc, p[0], p[1], p[2]);
		}
	}

	for (let i = 0; i < argcount[0]; i++){
		if (oarg)
			op_arg(prg.ops, p[i]);
		symtbl_clearTemp(sym, p[i]);
	}

	if (mode === pem_enum.EMPTY){
		symtbl_clearTemp(sym, intoVlc);
		return per_ok(VARLOC_NULL);
	}
	return per_ok(intoVlc);
}

function program_lvalCheckNil(pgen: pgen_st, lv: lvr_st, jumpFalse: boolean, inverted: boolean,
	skip: label_st): per_st {
	let prg = pgen.prg;
	let sym = pgen.sym;
	switch (lv.type){
		case lvr_enum.VAR:
		case lvr_enum.INDEX: {
			let pe = program_lvalGet(pgen, plm_enum.CREATE, VARLOC_NULL, lv);
			if (!pe.ok)
				return pe;
			if (jumpFalse === !inverted)
				label_jumpfalse(skip, prg.ops, pe.vlc);
			else
				label_jumptrue(skip, prg.ops, pe.vlc);
			symtbl_clearTemp(sym, pe.vlc);
		} break;

		case lvr_enum.SLICE:
		case lvr_enum.SLICEINDEX: {
			let obj: varloc_st;
			let start: varloc_st;
			let len: varloc_st;
			if (lv.type === lvr_enum.SLICE){
				obj = lv.obj;
				start = lv.start;
				len = lv.len;
			}
			else{
				let pe = program_lvalGetIndex(pgen, lv);
				if (!pe.ok)
					return pe;
				obj = pe.vlc;
				start = lv.start;
				len = lv.len;
			}

			let ts = symtbl_addTemp(sym);
			if (!ts.ok)
				return per_error(lv.flp, ts.msg);
			let idx = ts.vlc;

			ts = symtbl_addTemp(sym);
			if (!ts.ok)
				return per_error(lv.flp, ts.msg);
			let t = ts.vlc;

			op_numint(prg.ops, idx, 0);

			let next = label_new('^condslicenext');

			op_nil(prg.ops, t);
			op_binop(prg.ops, op_enum.EQU, t, t, len);
			label_jumpfalse(next, prg.ops, t);
			op_unop(prg.ops, op_enum.SIZE, t, obj);
			op_binop(prg.ops, op_enum.NUM_SUB, len, t, start);

			label_declare(next, prg.ops);

			op_binop(prg.ops, op_enum.LT, t, idx, len);

			let keep = label_new('^condslicekeep');
			label_jumpfalse(inverted ? keep : skip, prg.ops, t);

			op_binop(prg.ops, op_enum.NUM_ADD, t, idx, start);
			op_getat(prg.ops, t, obj, t);
			if (jumpFalse)
				label_jumptrue(inverted ? skip : keep, prg.ops, t);
			else
				label_jumpfalse(inverted ? skip : keep, prg.ops, t);

			op_inc(prg.ops, idx);
			label_jump(next, prg.ops);
			label_declare(keep, prg.ops);

			symtbl_clearTemp(sym, idx);
			symtbl_clearTemp(sym, t);
		} break;

		case lvr_enum.LIST: {
			let keep = label_new('^condkeep');
			for (let i = 0; i < lv.body.length; i++)
				program_lvalCheckNil(pgen, lv.body[i], jumpFalse, true, inverted ? skip : keep);
			if (lv.rest !== null)
				program_lvalCheckNil(pgen, lv.rest, jumpFalse, true, inverted ? skip : keep);
			if (!inverted)
				label_jump(skip, prg.ops);
			label_declare(keep, prg.ops);
		} break;
	}
	return per_ok(VARLOC_NULL);
}

function program_lvalCondAssignPart(pgen: pgen_st, lv: lvr_st, jumpFalse: boolean,
	valueVlc: varloc_st): per_st {
	let prg = pgen.prg;
	let sym = pgen.sym;
	switch (lv.type){
		case lvr_enum.VAR:
		case lvr_enum.INDEX: {
			let pe = program_lvalGet(pgen, plm_enum.CREATE, VARLOC_NULL, lv);
			if (!pe.ok)
				return pe;
			let skip = label_new("^condskippart");
			if (jumpFalse)
				label_jumpfalse(skip, prg.ops, pe.vlc);
			else
				label_jumptrue(skip, prg.ops, pe.vlc);
			symtbl_clearTemp(sym, pe.vlc);
			pe = program_evalLval(pgen, pem_enum.EMPTY, VARLOC_NULL, lv, op_enum.INVALID, valueVlc,
				true);
			if (!pe.ok)
				return pe;
			label_declare(skip, prg.ops);
		} break;

		case lvr_enum.SLICE:
		case lvr_enum.SLICEINDEX: {
			let obj: varloc_st;
			let start: varloc_st;
			let len: varloc_st;
			if (lv.type === lvr_enum.SLICE){
				obj = lv.obj;
				start = lv.start;
				len = lv.len;
			}
			else{
				let pe = program_lvalGetIndex(pgen, lv);
				if (!pe.ok)
					return pe;
				obj = pe.vlc;
				start = lv.start;
				len = lv.len;
			}

			let ts = symtbl_addTemp(sym);
			if (!ts.ok)
				return per_error(lv.flp, ts.msg);
			let idx = ts.vlc;

			ts = symtbl_addTemp(sym);
			if (!ts.ok)
				return per_error(lv.flp, ts.msg);
			let t = ts.vlc;

			ts = symtbl_addTemp(sym);
			if (!ts.ok)
				return per_error(lv.flp, ts.msg);
			let t2 = ts.vlc;

			op_numint(prg.ops, idx, 0);

			let next = label_new('^condpartslicenext');

			op_nil(prg.ops, t);
			op_binop(prg.ops, op_enum.EQU, t, t, len);
			label_jumpfalse(next, prg.ops, t);
			op_unop(prg.ops, op_enum.SIZE, t, obj);
			op_binop(prg.ops, op_enum.NUM_SUB, len, t, start);

			label_declare(next, prg.ops);

			op_binop(prg.ops, op_enum.LT, t, idx, len);

			let done = label_new('^condpartslicedone');
			label_jumpfalse(done, prg.ops, t);

			let inc = label_new('^condpartsliceinc');
			op_binop(prg.ops, op_enum.NUM_ADD, t, idx, start);
			op_getat(prg.ops, t2, obj, t);
			if (jumpFalse)
				label_jumpfalse(inc, prg.ops, t2);
			else
				label_jumptrue(inc, prg.ops, t2);

			op_getat(prg.ops, t2, valueVlc, idx);
			op_setat(prg.ops, obj, t, t2);

			label_declare(inc, prg.ops);
			op_inc(prg.ops, idx);
			label_jump(next, prg.ops);
			label_declare(done, prg.ops);

			symtbl_clearTemp(sym, idx);
			symtbl_clearTemp(sym, t);
			symtbl_clearTemp(sym, t2);
		} break;

		case lvr_enum.LIST: {
			let ts = symtbl_addTemp(sym);
			if (!ts.ok)
				return per_error(lv.flp, ts.msg);
			let t = ts.vlc;
			for (let i = 0; i < lv.body.length; i++){
				op_numint(prg.ops, t, i);
				op_getat(prg.ops, t, valueVlc, t);
				let pe = program_lvalCondAssignPart(pgen, lv.body[i], jumpFalse, t);
				if (!pe.ok)
					return pe;
			}
			if (lv.rest !== null){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(lv.flp, ts.msg);
				let t2 = ts.vlc;
				op_numint(prg.ops, t, lv.body.length);
				op_nil(prg.ops, t2);
				op_slice(prg.ops, t, valueVlc, t, t2);
				symtbl_clearTemp(sym, t2);
				let pe = program_lvalCondAssignPart(pgen, lv.rest, jumpFalse, t);
				if (!pe.ok)
					return pe;
			}
			symtbl_clearTemp(sym, t);
		} break;
	}
	return per_ok(VARLOC_NULL);
}

function program_lvalCondAssign(pgen: pgen_st, lv: lvr_st, jumpFalse: boolean,
	valueVlc: varloc_st): per_st {
	switch (lv.type){
		case lvr_enum.VAR:
		case lvr_enum.INDEX: {
			let pe = program_evalLval(pgen, pem_enum.EMPTY, VARLOC_NULL, lv, op_enum.INVALID,
				valueVlc, true);
			if (!pe.ok)
				return pe;
		} break;

		case lvr_enum.SLICE:
		case lvr_enum.SLICEINDEX:
		case lvr_enum.LIST:
			return program_lvalCondAssignPart(pgen, lv, jumpFalse, valueVlc);
	}
	symtbl_clearTemp(pgen.sym, valueVlc);
	return per_ok(VARLOC_NULL);
}

function program_eval(pgen: pgen_st, mode: pem_enum, intoVlc: varloc_st,
	ex: expr_st): per_st | Promise<per_st> {
	let prg = pgen.prg;
	let sym = pgen.sym;
	program_flp(prg, ex.flp);

	function handleListGroup(group: expr_st[], ls: varloc_st): per_st | Promise<per_st> {
		function handleNext(i: number): per_st | Promise<per_st> {
			if (i >= group.length){
				if (mode === pem_enum.INTO){
					symtbl_clearTemp(sym, ls);
					op_move(prg.ops, intoVlc, ls);
				}
				return per_ok(intoVlc);
			}
			return checkPromise<per_st, per_st>(
				program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, group[i]),
				function(pe: per_st): per_st | Promise<per_st> {
					if (!pe.ok)
						return pe;
					symtbl_clearTemp(sym, pe.vlc);
					op_param2(prg.ops, op_enum.LIST_PUSH, ls, ls, pe.vlc);
					return handleNext(i + 1);
				}
			);
		}
		return handleNext(0);
	}

	function handleGroup(group: expr_st[]): per_st | Promise<per_st> {
		function handleNext(i: number): per_st | Promise<per_st> {
			if (i === group.length - 1)
				return program_eval(pgen, mode, intoVlc, group[i]);
			return checkPromise<per_st, per_st>(
				program_eval(pgen, pem_enum.EMPTY, VARLOC_NULL, group[i]),
				function(pe: per_st): per_st | Promise<per_st> {
					if (!pe.ok)
						return pe;
					return handleNext(i + 1);
				}
			);
		}
		return handleNext(0);
	}

	function handleCat(t: varloc_st, tmax: number, cat: expr_st[]): per_st | Promise<per_st> {
		let p: varloc_st[] = [];
		function handleNextCat(ci: number): per_st | Promise<per_st> {
			if (ci >= cat.length){
				if (!varloc_isnull(t))
					symtbl_clearTemp(sym, t);
				if (mode === pem_enum.EMPTY){
					symtbl_clearTemp(sym, intoVlc);
					return per_ok(VARLOC_NULL);
				}
				return per_ok(intoVlc);
			}
			let len = cat.length - ci;
			if (len > tmax)
				len = tmax;
			function handleNextCatI(i: number): per_st | Promise<per_st> {
				if (i >= len){
					op_cat(prg.ops, ci > 0 ? t : intoVlc, len);
					for (let i = 0; i < len; i++){
						symtbl_clearTemp(sym, p[i]);
						op_arg(prg.ops, p[i]);
					}
					if (ci > 0){
						op_cat(prg.ops, intoVlc, 2);
						op_arg(prg.ops, intoVlc);
						op_arg(prg.ops, t);
					}
					return handleNextCat(ci + tmax);
				}
				return checkPromise<per_st, per_st>(
					program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, cat[ci + i]),
					function(pe: per_st): per_st | Promise<per_st> {
						if (!pe.ok)
							return pe;
						p[i] = pe.vlc;
						return handleNextCatI(i + 1);
					}
				);
			}
			return handleNextCatI(0);
		}
		return handleNextCat(0);
	}

	switch (ex.type){
		case expr_enum.NIL: {
			if (mode === pem_enum.EMPTY)
				return per_ok(VARLOC_NULL);
			else if (mode === pem_enum.CREATE){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(ex.flp, ts.msg);
				intoVlc = ts.vlc;
			}
			op_nil(prg.ops, intoVlc);
			return per_ok(intoVlc);
		}

		case expr_enum.NUM: {
			if (mode === pem_enum.EMPTY)
				return per_ok(VARLOC_NULL);
			else if (mode === pem_enum.CREATE){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(ex.flp, ts.msg);
				intoVlc = ts.vlc;
			}
			op_num(prg.ops, intoVlc, ex.num);
			return per_ok(intoVlc);
		}

		case expr_enum.STR: {
			if (mode === pem_enum.EMPTY)
				return per_ok(VARLOC_NULL);
			else if (mode === pem_enum.CREATE){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(ex.flp, ts.msg);
				intoVlc = ts.vlc;
			}
			let found = false;
			let index = 0;
			for ( ; index < prg.strTable.length; index++){
				if (ex.str === prg.strTable[index]){
					found = true;
					break;
				}
			}
			if (!found){
				if (index >= 0x7FFFFFFF)
					return per_error(ex.flp, 'Too many string constants');
				prg.strTable.push(ex.str);
			}
			op_str(prg.ops, intoVlc, index);
			return per_ok(intoVlc);
		}

		case expr_enum.LIST: {
			if (mode === pem_enum.EMPTY){
				if (ex.ex !== null)
					return program_eval(pgen, pem_enum.EMPTY, VARLOC_NULL, ex.ex);
				return per_ok(VARLOC_NULL);
			}
			else if (mode === pem_enum.CREATE){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(ex.flp, ts.msg);
				intoVlc = ts.vlc;
			}
			if (ex.ex !== null){
				if (ex.ex.type === expr_enum.GROUP){
					let ls = intoVlc;
					if (mode === pem_enum.INTO){
						let ts = symtbl_addTemp(sym);
						if (!ts.ok)
							return per_error(ex.flp, ts.msg);
						ls = ts.vlc;
					}
					op_list(prg.ops, ls, ex.ex.group.length);
					return handleListGroup(ex.ex.group, ls);
				}
				else{
					return checkPromise<per_st, per_st>(
						program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.ex),
						function(pe: per_st): per_st {
							if (!pe.ok)
								return pe;
							// check for `a = {a}`
							if (intoVlc.frame === pe.vlc.frame && intoVlc.index === pe.vlc.index){
								let ts = symtbl_addTemp(sym);
								if (!ts.ok)
									return per_error(ex.flp, ts.msg);
								symtbl_clearTemp(sym, ts.vlc);
								symtbl_clearTemp(sym, pe.vlc);
								op_list(prg.ops, ts.vlc, 1);
								op_param2(prg.ops, op_enum.LIST_PUSH, ts.vlc, ts.vlc, pe.vlc);
								op_move(prg.ops, intoVlc, ts.vlc);
							}
							else{
								symtbl_clearTemp(sym, pe.vlc);
								op_list(prg.ops, intoVlc, 1);
								op_param2(prg.ops, op_enum.LIST_PUSH, intoVlc, intoVlc, pe.vlc);
							}
							return per_ok(intoVlc);
						}
					);
				}
			}
			else
				op_list(prg.ops, intoVlc, 0);
			return per_ok(intoVlc);
		}

		case expr_enum.NAMES: {
			let sl = symtbl_lookup(sym, ex.names);
			if (!sl.ok)
				return per_error(ex.flp, sl.msg);
			switch (sl.nsn.type){
				case nsname_enumt.VAR: {
					if (mode === pem_enum.EMPTY)
						return per_ok(VARLOC_NULL);
					let varVlc = varloc_new(sl.nsn.fr.level, sl.nsn.index);
					if (mode === pem_enum.CREATE)
						return per_ok(varVlc);
					op_move(prg.ops, intoVlc, varVlc);
					return per_ok(intoVlc);
				}

				case nsname_enumt.ENUM: {
					if (mode === pem_enum.EMPTY)
						return per_ok(VARLOC_NULL);
					if (mode === pem_enum.CREATE){
						let ts = symtbl_addTemp(sym);
						if (!ts.ok)
							return per_error(ex.flp, ts.msg);
						intoVlc = ts.vlc;
					}
					op_num(prg.ops, intoVlc, sl.nsn.val);
					return per_ok(intoVlc);
				}

				case nsname_enumt.CMD_LOCAL:
				case nsname_enumt.CMD_NATIVE:
				case nsname_enumt.CMD_OPCODE:
					return program_evalCall(pgen, mode, intoVlc, ex.flp, sl.nsn, null);

				case nsname_enumt.NAMESPACE:
					return per_error(ex.flp, 'Invalid expression');
			}
			throw new Error('Invalid namespace entry');
		}

		case expr_enum.PAREN:
			return program_eval(pgen, mode, intoVlc, ex.ex);

		case expr_enum.GROUP:
			return handleGroup(ex.group);

		case expr_enum.CAT: {
			if (mode === pem_enum.EMPTY || mode === pem_enum.CREATE){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(ex.flp, ts.msg);
				intoVlc = ts.vlc;
			}
			let t = VARLOC_NULL;
			let tmax = symtbl_tempAvail(sym) - 128;
			if (tmax < 16)
				tmax = 16;
			if (ex.cat.length > tmax){
				tmax--;
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(ex.flp, ts.msg);
				t = ts.vlc;
			}
			return handleCat(t, tmax, ex.cat);
		}

		case expr_enum.PREFIX: {
			let unop = ks_toUnaryOp(ex.k);
			if (unop === op_enum.INVALID)
				return per_error(ex.flp, 'Invalid unary operator');
			return checkPromise<per_st, per_st>(
				program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.ex),
				function(pe: per_st): per_st | Promise<per_st> {
					if (!pe.ok)
						return pe;
					if (mode === pem_enum.EMPTY || mode === pem_enum.CREATE){
						let ts = symtbl_addTemp(sym);
						if (!ts.ok)
							return per_error(ex.flp, ts.msg);
						intoVlc = ts.vlc;
					}
					op_unop(prg.ops, unop, intoVlc, pe.vlc);
					symtbl_clearTemp(sym, pe.vlc);
					if (mode === pem_enum.EMPTY){
						symtbl_clearTemp(sym, intoVlc);
						return per_ok(VARLOC_NULL);
					}
					return per_ok(intoVlc);
				}
			);
		}

		case expr_enum.INFIX: {
			let mutop = ks_toMutateOp(ex.k);
			if (ex.k === ks_enum.EQU || ex.k === ks_enum.AMP2EQU ||
				ex.k === ks_enum.PIPE2EQU || mutop !== op_enum.INVALID){
				return checkPromise<lvp_st, per_st>(
					lval_prepare(pgen, ex.left),
					function(lp: lvp_st): per_st | Promise<per_st> {
						if (!lp.ok)
							return per_error(lp.flp, lp.msg);

						if (ex.k === ks_enum.AMP2EQU || ex.k === ks_enum.PIPE2EQU){
							let skip = label_new('^condsetskip');

							let pe = program_lvalCheckNil(pgen, lp.lv, ex.k === ks_enum.AMP2EQU,
								false, skip);
							if (!pe.ok)
								return pe;

							if (ex.right === null)
								throw new Error('Invalid infix operator (right is null)');
							return checkPromise<per_st, per_st>(
								program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.right),
								function(pe: per_st): per_st | Promise<per_st> {
									if (!pe.ok)
										return pe;

									if (!lp.ok)
										throw new Error('Invalid lvalue conditional assignment');

									let pe2 = program_lvalCondAssign(pgen, lp.lv,
										ex.k === ks_enum.AMP2EQU, pe.vlc);
									if (!pe2.ok)
										return pe2;

									if (mode === pem_enum.EMPTY){
										label_declare(skip, prg.ops);
										lval_clearTemps(lp.lv, sym);
										return per_ok(VARLOC_NULL);
									}

									label_declare(skip, prg.ops);

									if (mode === pem_enum.CREATE){
										let ts = symtbl_addTemp(sym);
										if (!ts.ok)
											return per_error(ex.flp, ts.msg);
										intoVlc = ts.vlc;
									}

									let ple = program_lvalGet(pgen, plm_enum.INTO, intoVlc, lp.lv);
									if (!ple.ok)
										return ple;

									lval_clearTemps(lp.lv, sym);
									return per_ok(intoVlc);
								}
							);
						}

						// special handling for basic variable assignment to avoid a temporary
						if (ex.right === null)
							throw new Error('Invalid assignment (right is null)');
						if (ex.k === ks_enum.EQU && lp.lv.type === lvr_enum.VAR){
							return checkPromise<per_st, per_st>(
								program_eval(pgen, pem_enum.INTO, lp.lv.vlc, ex.right),
								function(pe: per_st): per_st {
									if (!pe.ok)
										return pe;
									if (mode === pem_enum.EMPTY)
										return per_ok(VARLOC_NULL);
									else if (mode === pem_enum.CREATE){
										let ts = symtbl_addTemp(sym);
										if (!ts.ok)
											return per_error(ex.flp, ts.msg);
										intoVlc = ts.vlc;
									}
									if (!lp.ok)
										throw new Error('Lvalue is an error in basic assignment');
									op_move(prg.ops, intoVlc, lp.lv.vlc);
									return per_ok(intoVlc);
								}
							);
						}

						return checkPromise<per_st, per_st>(
							program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.right),
							function(pe: per_st): per_st {
								if (!pe.ok)
									return pe;
								if (!lp.ok)
									throw new Error('Lvalue is an error in assignment');
								return program_evalLval(pgen, mode, intoVlc, lp.lv, mutop, pe.vlc, true);
							}
						);
					}
				);
			}

			if (mode === pem_enum.EMPTY || mode === pem_enum.CREATE){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(ex.flp, ts.msg);
				intoVlc = ts.vlc;
			}

			let binop = ks_toBinaryOp(ex.k);
			if (binop !== op_enum.INVALID){
				return checkPromise<per_st, per_st>(
					program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.left),
					function(pe: per_st): per_st | Promise<per_st> {
						if (!pe.ok)
							return pe;
						let left = pe.vlc;
						if (ex.right === null)
							throw new Error('Infix operator has null right');
						return checkPromise<per_st, per_st>(
							program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.right),
							function(pe: per_st): per_st {
								if (!pe.ok)
									return pe;
								program_flp(prg, ex.flp);
								op_binop(prg.ops, binop, intoVlc, left, pe.vlc);
								symtbl_clearTemp(sym, left);
								symtbl_clearTemp(sym, pe.vlc);
								if (mode === pem_enum.EMPTY){
									symtbl_clearTemp(sym, intoVlc);
									return per_ok(VARLOC_NULL);
								}
								return per_ok(intoVlc);
							}
						);
					}
				);
			}
			else if (ex.k === ks_enum.AMP2 || ex.k === ks_enum.PIPE2){
				return checkPromise<per_st, per_st>(
					program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.left),
					function(pe: per_st): per_st | Promise<per_st> {
						if (!pe.ok)
							return pe;
						let left = pe.vlc;
						let useleft = label_new('^useleft');
						if (ex.k === ks_enum.AMP2)
							label_jumpfalse(useleft, prg.ops, left);
						else
							label_jumptrue(useleft, prg.ops, left);
						if (ex.right === null)
							throw new Error('Infix conditional has null right expression');
						return checkPromise<per_st, per_st>(
							program_eval(pgen, pem_enum.INTO, intoVlc, ex.right),
							function(pe: per_st): per_st {
								if (!pe.ok)
									return pe;
								let finish = label_new('^finish');
								label_jump(finish, prg.ops);
								label_declare(useleft, prg.ops);
								op_move(prg.ops, intoVlc, left);
								label_declare(finish, prg.ops);
								symtbl_clearTemp(sym, left);
								if (mode === pem_enum.EMPTY){
									symtbl_clearTemp(sym, intoVlc);
									return per_ok(VARLOC_NULL);
								}
								return per_ok(intoVlc);
							}
						);
					}
				);
			}
			return per_error(ex.flp, 'Invalid operation');
		}

		case expr_enum.CALL: {
			if (ex.cmd.type !== expr_enum.NAMES)
				return per_error(ex.flp, 'Invalid call');
			let sl = symtbl_lookup(sym, ex.cmd.names);
			if (!sl.ok)
				return per_error(ex.flp, sl.msg);
			return program_evalCall(pgen, mode, intoVlc, ex.flp, sl.nsn, ex.params);
		}

		case expr_enum.INDEX: {
			if (mode === pem_enum.EMPTY){
				return checkPromise<per_st, per_st>(
					program_eval(pgen, pem_enum.EMPTY, VARLOC_NULL, ex.obj),
					function(pe: per_st): per_st | Promise<per_st> {
						if (!pe.ok)
							return pe;
						return checkPromise<per_st, per_st>(
							program_eval(pgen, pem_enum.EMPTY, VARLOC_NULL, ex.key),
							function(pe: per_st): per_st {
								if (!pe.ok)
									return pe;
								return per_ok(VARLOC_NULL);
							}
						);
					}
				);
			}

			if (mode === pem_enum.CREATE){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(ex.flp, ts.msg);
				intoVlc = ts.vlc;
			}

			return checkPromise<per_st, per_st>(
				program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.obj),
				function(pe: per_st): per_st | Promise<per_st> {
					if (!pe.ok)
						return pe;
					let obj = pe.vlc;

					return checkPromise<per_st, per_st>(
						program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.key),
						function(pe: per_st): per_st {
							if (!pe.ok)
								return pe;
							let key = pe.vlc;

							op_getat(prg.ops, intoVlc, obj, key);
							symtbl_clearTemp(sym, obj);
							symtbl_clearTemp(sym, key);
							return per_ok(intoVlc);
						}
					);
				}
			);
		}

		case expr_enum.SLICE: {
			if (mode === pem_enum.EMPTY || mode === pem_enum.CREATE){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return per_error(ex.flp, ts.msg);
				intoVlc = ts.vlc;
			}
			return checkPromise<per_st, per_st>(
				program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.obj),
				function(pe: per_st): per_st | Promise<per_st> {
					if (!pe.ok)
						return pe;
					let obj = pe.vlc;
					return checkPromise<psr_st, per_st>(
						program_slice(pgen, ex),
						function(sr: psr_st): per_st {
							if (!sr.ok)
								return per_error(sr.flp, sr.msg);
							op_slice(prg.ops, intoVlc, obj, sr.start, sr.len);
							symtbl_clearTemp(sym, obj);
							symtbl_clearTemp(sym, sr.start);
							symtbl_clearTemp(sym, sr.len);
							if (mode === pem_enum.EMPTY){
								symtbl_clearTemp(sym, intoVlc);
								return per_ok(VARLOC_NULL);
							}
							return per_ok(intoVlc);
						}
					);
				}
			);
		}
	}
	throw new Error('Invalid expression type');
}

function program_exprToNum(pgen: pgen_st, ex: expr_st): pen_st {
	if (ex.type === expr_enum.NUM)
		return pen_ok(ex.num);
	else if (ex.type === expr_enum.NAMES){
		var sl = symtbl_lookup(pgen.sym, ex.names);
		if (!sl.ok)
			return pen_error(sl.msg);
		if (sl.nsn.type === nsname_enumt.ENUM)
			return pen_ok(sl.nsn.val);
	}
	else if (ex.type === expr_enum.PAREN)
		return program_exprToNum(pgen, ex.ex);
	else if (ex.type === expr_enum.PREFIX){
		let n = program_exprToNum(pgen, ex.ex);
		if (n.ok){
			let k = ks_toUnaryOp(ex.k);
			if (k === op_enum.TONUM)
				return pen_ok(n.value);
			else if (k == op_enum.NUM_NEG)
				return pen_ok(-n.value);
		}
	}
	else if (ex.type === expr_enum.INFIX){
		let n1 = program_exprToNum(pgen, ex.left);
		if (!n1.ok)
			return n1;
		if (ex.right === null)
			throw new Error('Expression cannot have null right side');
		let n2 = program_exprToNum(pgen, ex.right);
		if (!n2.ok)
			return n2;
		let binop = ks_toBinaryOp(ex.k);
		if      (binop === op_enum.NUM_ADD) return pen_ok(n1.value + n2.value);
		else if (binop === op_enum.NUM_SUB) return pen_ok(n1.value - n2.value);
		else if (binop === op_enum.NUM_MOD) return pen_ok(n1.value % n2.value);
		else if (binop === op_enum.NUM_MUL) return pen_ok(n1.value * n2.value);
		else if (binop === op_enum.NUM_DIV) return pen_ok(n1.value / n2.value);
		else if (binop === op_enum.NUM_POW) return pen_ok(Math.pow(n1.value, n2.value));
	}
	return pen_error('Enums must be a constant number');
}

type pgst_st = pgs_dowhile_st | pgs_for_st | pgs_loop_st | pgs_if_st | label_st | null;

enum pgr_enum {
	OK,
	PUSH,
	POP,
	ERROR,
	FORVARS
}

interface pgr_st_OK {
	type: pgr_enum.OK;
}
interface pgr_st_PUSH {
	type: pgr_enum.PUSH;
	pgs: pgst_st;
}
interface pgr_st_POP {
	type: pgr_enum.POP;
}
interface pgr_st_ERROR {
	type: pgr_enum.ERROR,
	flp: filepos_st;
	msg: string;
}
interface pgr_st_FORVARS {
	type: pgr_enum.FORVARS;
	val_vlc: varloc_st;
	idx_vlc: varloc_st;
}
type pgr_st = pgr_st_OK | pgr_st_PUSH | pgr_st_POP | pgr_st_ERROR | pgr_st_FORVARS;

function pgr_ok(): pgr_st {
	return { type: pgr_enum.OK };
}

function pgr_push(pgs: pgst_st): pgr_st {
	return { type: pgr_enum.PUSH, pgs: pgs };
}

function pgr_pop(): pgr_st {
	return { type: pgr_enum.POP };
}

function pgr_error(flp: filepos_st, msg: string): pgr_st {
	return { type: pgr_enum.ERROR, flp: flp, msg: msg };
}

function pgr_forvars(val_vlc: varloc_st, idx_vlc: varloc_st): pgr_st {
	return { type: pgr_enum.FORVARS, val_vlc: val_vlc, idx_vlc: idx_vlc };
}

interface pgs_dowhile_st {
	top: label_st | null;
	cond: label_st;
	finish: label_st;
}

function pgs_dowhile_new(top: label_st, cond: label_st, finish: label_st): pgs_dowhile_st {
	return { top: top, cond: cond, finish: finish };
}

function pgs_dowhile_check(v: any): v is pgs_dowhile_st {
	return typeof v === 'object' && v !== null && label_check(v.cond);
}

interface pgs_for_st {
	top: label_st;
	inc: label_st;
	finish: label_st;
	t1: varloc_st;
	t2: varloc_st;
	t3: varloc_st;
	t4: varloc_st;
	val_vlc: varloc_st;
	idx_vlc: varloc_st;
}

function pgs_for_new(t1: varloc_st, t2: varloc_st, t3: varloc_st, t4: varloc_st, val_vlc: varloc_st,
	idx_vlc: varloc_st, top: label_st, inc: label_st, finish: label_st): pgs_for_st {
	return {
		t1: t1, t2: t2, t3: t3, t4: t4,
		val_vlc: val_vlc, idx_vlc: idx_vlc,
		top: top, inc: inc, finish: finish
	};
}

function pgs_for_check(v: any): v is pgs_for_st {
	return typeof v === 'object' && v !== null && label_check(v.inc);
}

interface pgs_loop_st {
	lcont: label_st;
	lbrk: label_st;
}

function pgs_loop_new(lcont: label_st, lbrk: label_st): pgs_loop_st {
	return { lcont: lcont, lbrk: lbrk };
}

function pgs_loop_check(v: any): v is pgs_loop_st {
	return typeof v === 'object' && v !== null && label_check(v.lcont);
}

interface pgs_if_st {
	nextcond: label_st | null;
	ifdone: label_st;
}

function pgs_if_new(nextcond: label_st | null, ifdone: label_st): pgs_if_st {
	return { nextcond: nextcond, ifdone: ifdone };
}

function pgs_if_check(v: any): v is pgs_if_st {
	return typeof v === 'object' && v !== null && label_check(v.ifdone);
}

interface pfvs_res_st {
	vlc: varloc_st;
	err: string | null;
}

function program_forVarsSingle(sym: symtbl_st, forVar: boolean,
	names: string[] | null): pfvs_res_st {
	if (names === null || forVar){
		let ts = names === null ? symtbl_addTemp(sym) : symtbl_addVar(sym, names, -1);
		if (!ts.ok)
			return { vlc: VARLOC_NULL, err: ts.msg };
		return { vlc: ts.vlc, err: null };
	}
	else{
		let sl = symtbl_lookup(sym, names);
		if (!sl.ok)
			return { vlc: VARLOC_NULL, err: sl.msg };
		if (sl.nsn.type !== nsname_enumt.VAR)
			return { vlc: VARLOC_NULL, err: 'Cannot use non-variable in for loop' };
		return { vlc: varloc_new(sl.nsn.fr.level, sl.nsn.index), err: null };
	}
}

function program_forVars(sym: symtbl_st, stmt: ast_st_FOR1): pgr_st {
	let pf1: pfvs_res_st = { vlc: VARLOC_NULL, err: null };
	if (stmt.names1 !== null){
		pf1 = program_forVarsSingle(sym, stmt.forVar, stmt.names1);
		if (pf1.err !== null)
			return pgr_error(stmt.flp, pf1.err);
	}
	let pf2 = program_forVarsSingle(sym, stmt.forVar, stmt.names2);
	if (pf2.err !== null)
		return pgr_error(stmt.flp, pf2.err);
	return pgr_forvars(pf1.vlc, pf2.vlc);
}

function program_genForRange(pgen: pgen_st, stmt: ast_st_FOR1, p1: varloc_st, p2: varloc_st,
	p3: varloc_st): pgr_st {
	let prg = pgen.prg;
	let sym = pgen.sym;
	let zerostart = false;
	if (varloc_isnull(p2)){
		zerostart = true;
		p2 = p1;
		let ts = symtbl_addTemp(sym);
		if (!ts.ok)
			return pgr_error(stmt.flp, ts.msg);
		p1 = ts.vlc;
		op_numint(prg.ops, p1, 0);
	}

	symtbl_pushScope(sym);
	let pgi = program_forVars(sym, stmt);
	if (pgi.type !== pgr_enum.FORVARS)
		return pgi;
	let val_vlc = pgi.val_vlc;
	let idx_vlc = pgi.idx_vlc;

	// clear the index
	op_numint(prg.ops, idx_vlc, 0);

	// calculate count
	if (!zerostart)
		op_binop(prg.ops, op_enum.NUM_SUB, p2, p2, p1);
	if (!varloc_isnull(p3))
		op_binop(prg.ops, op_enum.NUM_DIV, p2, p2, p3);

	let top    = label_new('^forR_top');
	let inc    = label_new('^forR_inc');
	let finish = label_new('^forR_finish');

	let ts = symtbl_addTemp(sym);
	if (!ts.ok)
		return pgr_error(stmt.flp, ts.msg);
	let t = ts.vlc;

	label_declare(top, prg.ops);

	op_binop(prg.ops, op_enum.LT, t, idx_vlc, p2);
	label_jumpfalse(finish, prg.ops, t);

	if (!varloc_isnull(val_vlc)){
		if (varloc_isnull(p3)){
			if (!zerostart)
				op_binop(prg.ops, op_enum.NUM_ADD, val_vlc, p1, idx_vlc);
			else
				op_move(prg.ops, val_vlc, idx_vlc);
		}
		else{
			op_binop(prg.ops, op_enum.NUM_MUL, val_vlc, idx_vlc, p3);
			if (!zerostart)
				op_binop(prg.ops, op_enum.NUM_ADD, val_vlc, p1, val_vlc);
		}
	}

	sym.sc.lblBreak = finish;
	sym.sc.lblContinue = inc;

	return pgr_push(pgs_for_new(p1, p2, p3, t, val_vlc, idx_vlc, top, inc, finish));
}

function program_genForGeneric(pgen: pgen_st, stmt: ast_st_FOR1): pgr_st | Promise<pgr_st> {
	let prg = pgen.prg;
	let sym = pgen.sym;
	return checkPromise<per_st, pgr_st>(
		program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, stmt.ex),
		function(pe: per_st): pgr_st {
			if (!pe.ok)
				return pgr_error(pe.flp, pe.msg);

			symtbl_pushScope(sym);

			let exp_vlc = pe.vlc;

			let pgi = program_forVars(sym, stmt);
			if (pgi.type !== pgr_enum.FORVARS)
				return pgi;
			let val_vlc = pgi.val_vlc;
			let idx_vlc = pgi.idx_vlc;

			// clear the index
			op_numint(prg.ops, idx_vlc, 0);

			let top    = label_new('^forG_top');
			let inc    = label_new('^forG_inc');
			let finish = label_new('^forG_finish');

			let ts = symtbl_addTemp(sym);
			if (!ts.ok)
				return pgr_error(stmt.flp, ts.msg);
			let t = ts.vlc;

			label_declare(top, prg.ops);

			op_unop(prg.ops, op_enum.SIZE, t, exp_vlc);
			op_binop(prg.ops, op_enum.LT, t, idx_vlc, t);
			label_jumpfalse(finish, prg.ops, t);

			if (!varloc_isnull(val_vlc))
				op_getat(prg.ops, val_vlc, exp_vlc, idx_vlc);
			sym.sc.lblBreak = finish;
			sym.sc.lblContinue = inc;

			return pgr_push(pgs_for_new(t, exp_vlc, VARLOC_NULL, VARLOC_NULL, val_vlc, idx_vlc,
				top, inc, finish));
		}
	);
}

function program_gen(pgen: pgen_st, stmt: ast_st, state: pgst_st,
	sayexpr: boolean): pgr_st | Promise<pgr_st> {
	let prg = pgen.prg;
	let sym = pgen.sym;
	program_flp(prg, stmt.flp);

	function handleDefArgs(stmt: ast_st_DEF1, skip: label_st,
		lvs: number, level: number): pgr_st | Promise<pgr_st> {
		// initialize our arguments as needed
		function handleNext(i: number): pgr_st | Promise<pgr_st> {
			if (i >= lvs)
				return pgr_push(skip);

			let ex = stmt.lvalues[i];

			function handleInfixRest(arg: varloc_st): pgr_st | Promise<pgr_st> {
				// now we can add the param symbols
				if (ex.type !== expr_enum.INFIX)
					throw new Error('Expecting parameter expression to be infix');
				let lr = lval_addVars(sym, ex.left, i);
				if (!lr.ok)
					return pgr_error(lr.flp, lr.msg);

				// move argument into lval(s)
				let pe = program_evalLval(pgen, pem_enum.EMPTY, VARLOC_NULL, lr.lv,
					op_enum.INVALID, arg, true);
				if (!pe.ok)
					return pgr_error(pe.flp, pe.msg);
				return handleNext(i + 1);
			}

			if (ex.type === expr_enum.INFIX){
				// the argument is the i-th register
				let arg = varloc_new(level, i);

				// check for initialization -- must happen before the symbols are added so that
				// `def a x = x` binds the seconds `x` to the outer scope
				if (ex.right !== null){
					let argset = label_new('^argset');
					label_jumptrue(argset, prg.ops, arg);
					return checkPromise<per_st, pgr_st>(
						program_eval(pgen, pem_enum.INTO, arg, ex.right),
						function(pr: per_st): pgr_st | Promise<pgr_st> {
							if (!pr.ok)
								return pgr_error(pr.flp, pr.msg);
							label_declare(argset, prg.ops);
							return handleInfixRest(arg);
						}
					);
				}
				return handleInfixRest(arg);
			}
			else if (i === lvs - 1 && ex.type === expr_enum.PREFIX && ex.k === ks_enum.PERIOD3){
				let lr = lval_addVars(sym, ex.ex, i);
				if (!lr.ok)
					return pgr_error(lr.flp, lr.msg);
				if (lr.lv.type !== lvr_enum.VAR)
					throw new Error('Assertion failed: `...rest` parameter must be identifier');
			}
			else
				throw new Error('Assertion failed: parameter must be infix expression');
			return handleNext(i + 1);
		}
		return handleNext(0);
	}

	function handleGenRangeGroup(stmt: ast_st_FOR1, p: expr_st_GROUP): pgr_st | Promise<pgr_st> {
		let rp: varloc_st[] = [VARLOC_NULL, VARLOC_NULL, VARLOC_NULL];
		function handleNext(i: number): pgr_st | Promise<pgr_st> {
			if (i >= p.group.length)
				return program_genForRange(pgen, stmt, rp[0], rp[1], rp[2]);
			if (i < 3){
				let ts = symtbl_addTemp(sym);
				if (!ts.ok)
					return pgr_error(stmt.flp, ts.msg);
				rp[i] = ts.vlc;
			}
			return checkPromise<per_st, pgr_st>(
				program_eval(pgen,
					i < 3 ? pem_enum.INTO : pem_enum.EMPTY,
					i < 3 ? rp[i] : VARLOC_NULL,
					p.group[i]),
				function(pe: per_st): pgr_st | Promise<pgr_st> {
					if (!pe.ok)
						return pgr_error(pe.flp, pe.msg);
					return handleNext(i + 1);
				}
			);
		}
		return handleNext(0);
	}

	function handleVar(stmt: ast_st_VAR): pgr_st | Promise<pgr_st> {
		function handleNext(i: number): pgr_st | Promise<pgr_st> {
			if (i >= stmt.lvalues.length)
				return pgr_ok();

			let ex1 = stmt.lvalues[i];
			if (ex1.type !== expr_enum.INFIX)
				throw new Error('Var expressions must be infix');
			let ex: expr_st_INFIX = ex1;
			let pr_vlc: varloc_st = VARLOC_NULL;

			if (ex.right !== null){
				return checkPromise<per_st, pgr_st>(
					program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex.right),
					function(pr: per_st): pgr_st | Promise<pgr_st> {
						if (!pr.ok)
							return pgr_error(pr.flp, pr.msg);
						pr_vlc = pr.vlc;
						return handleAddVars();
					}
				);
			}
			return handleAddVars();

			function handleAddVars(): pgr_st | Promise<pgr_st> {
				let lr = lval_addVars(sym, ex.left, -1);
				if (!lr.ok)
					return pgr_error(lr.flp, lr.msg);
				if (ex.right !== null){
					let pe = program_evalLval(pgen, pem_enum.EMPTY, VARLOC_NULL, lr.lv,
						op_enum.INVALID, pr_vlc, true);
					if (!pe.ok)
						return pgr_error(pe.flp, pe.msg);
					symtbl_clearTemp(sym, pr_vlc);
				}
				return handleNext(i + 1);
			}
		}
		return handleNext(0);
	}

	switch (stmt.type){
		case ast_enumt.BREAK: {
			if (sym.sc.lblBreak === null)
				return pgr_error(stmt.flp, 'Invalid `break`');
			label_jump(sym.sc.lblBreak, prg.ops);
			return pgr_ok();
		}

		case ast_enumt.CONTINUE: {
			if (sym.sc.lblContinue === null)
				return pgr_error(stmt.flp, 'Invalid `continue`');
			label_jump(sym.sc.lblContinue, prg.ops);
			return pgr_ok();
		}

		case ast_enumt.DECLARE: {
			let dc = stmt.declare;
			if (dc.local){
				let lbl = label_new('^def');
				sym.fr.lbls.push(lbl);
				let smsg = symtbl_addCmdLocal(sym, dc.names, lbl);
				if (smsg !== null)
					return pgr_error(dc.flp, smsg);
			}
			else{ // native
				if (dc.key === null)
					throw new Error('Expecting native declaration to have key');
				let smsg = symtbl_addCmdNative(sym, dc.names, native_hash(dc.key));
				if (smsg !== null)
					return pgr_error(dc.flp, smsg);
			}
			return pgr_ok();
		}

		case ast_enumt.DEF1: {
			let n = namespace_lookupImmediate(sym.sc.ns, stmt.names);
			let lbl: label_st;
			if (n.found && n.nsn.type === nsname_enumt.CMD_LOCAL){
				lbl = n.nsn.lbl;
				if (!sym.repl && lbl.pos >= 0) // if already defined, error
					return pgr_error(stmt.flpN, 'Cannot redefine: ' + stmt.names.join('.'));
			}
			else{
				lbl = label_new('^def');
				sym.fr.lbls.push(lbl);
				let smsg = symtbl_addCmdLocal(sym, stmt.names, lbl);
				if (smsg !== null)
					return pgr_error(stmt.flpN, smsg);
			}

			let level = sym.fr.level + 1;
			if (level > 255)
				return pgr_error(stmt.flp, 'Too many nested commands');
			let rest = 0xFF;
			let lvs = stmt.lvalues.length;
			if (lvs > 255)
				return pgr_error(stmt.flp, 'Too many parameters');
			if (lvs > 0){
				let last_ex = stmt.lvalues[lvs - 1];
				// is the last expression a `...rest`?
				if (last_ex.type === expr_enum.PREFIX && last_ex.k === ks_enum.PERIOD3)
					rest = lvs - 1;
			}

			let skip = label_new('^after_def');
			label_jump(skip, prg.ops);

			label_declare(lbl, prg.ops);
			symtbl_pushFrame(sym);

			program_cmdhint(prg, stmt.names);
			op_cmdhead(prg.ops, level, rest);

			// reserve our argument registers as explicit registers 0 to lvs-1
			symtbl_reserveVars(sym, lvs);

			return handleDefArgs(stmt, skip, lvs, level);
		}

		case ast_enumt.DEF2: {
			program_cmdhint(prg, null);
			op_cmdtail(prg.ops);
			symtbl_popFrame(sym);
			if (!label_check(state))
				throw new Error('Expecting state to be a label');
			let skip: label_st = state;
			label_declare(skip, prg.ops);
			return pgr_pop();
		}

		case ast_enumt.DOWHILE1: {
			let top    = label_new('^dowhile_top');
			let cond   = label_new('^dowhile_cond');
			let finish = label_new('^dowhile_finish');

			symtbl_pushScope(sym);
			sym.sc.lblBreak = finish;
			sym.sc.lblContinue = cond;

			label_declare(top, prg.ops);
			return pgr_push(pgs_dowhile_new(top, cond, finish));
		}

		case ast_enumt.DOWHILE2: {
			if (!pgs_dowhile_check(state))
				throw new Error('Expecting state to be do-while structure');
			let pst: pgs_dowhile_st = state;

			label_declare(pst.cond, prg.ops);
			if (stmt.cond === null){
				// do end
				pst.top = null;
				return pgr_ok();
			}
			else{
				// do while end
				return checkPromise<per_st, pgr_st>(
					program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, stmt.cond),
					function(pe: per_st): pgr_st {
						if (!pgs_dowhile_check(state))
							throw new Error('Expecting state to be do-while structure');
						let pst: pgs_dowhile_st = state;
						if (!pe.ok)
							return pgr_error(pe.flp, pe.msg);
						label_jumpfalse(pst.finish, prg.ops, pe.vlc);
						symtbl_clearTemp(sym, pe.vlc);
						sym.sc.lblContinue = pst.top;
						return pgr_ok();
					}
				);
			}
		}

		case ast_enumt.DOWHILE3: {
			if (!pgs_dowhile_check(state))
				throw new Error('Expecting state to be do-while structure');
			let pst: pgs_dowhile_st = state;

			if (pst.top !== null)
				label_jump(pst.top, prg.ops);
			label_declare(pst.finish, prg.ops);
			symtbl_popScope(sym);
			return pgr_pop();
		}

		case ast_enumt.ENUM: {
			let last_val = -1;
			for (let i = 0; i < stmt.lvalues.length; i++){
				let ex = stmt.lvalues[i];
				if (ex.type !== expr_enum.INFIX)
					throw new Error('Enum expression must be infix');
				let v = last_val + 1;
				if (ex.right !== null){
					let n = program_exprToNum(pgen, ex.right);
					if (!n.ok)
						return pgr_error(stmt.flp, n.msg);
					v = n.value;
				}
				if (ex.left.type !== expr_enum.NAMES)
					return pgr_error(stmt.flp, 'Enum name must only consist of identifiers');
				last_val = v;
				let smsg = symtbl_addEnum(sym, ex.left.names, v);
				if (smsg !== null)
					return pgr_error(stmt.flp, smsg);
			}
			return pgr_ok();
		}

		case ast_enumt.FOR1: {
			if (stmt.ex.type === expr_enum.CALL){
				let c: expr_st_CALL = stmt.ex;
				if (c.cmd.type === expr_enum.NAMES){
					let n: expr_st_NAMES = c.cmd;
					let sl = symtbl_lookup(sym, n.names);
					if (!sl.ok)
						return pgr_error(stmt.flp, sl.msg);
					let nsn = sl.nsn;
					if (nsn.type === nsname_enumt.CMD_OPCODE && nsn.opcode === op_enum.RANGE){
						let p = c.params;
						if (p.type === expr_enum.GROUP)
							return handleGenRangeGroup(stmt, p);
						else{
							let rp: varloc_st[] = [VARLOC_NULL, VARLOC_NULL, VARLOC_NULL];
							let ts = symtbl_addTemp(sym);
							if (!ts.ok)
								return pgr_error(stmt.flp, ts.msg);
							rp[0] = ts.vlc;
							return checkPromise<per_st, pgr_st>(
								program_eval(pgen, pem_enum.INTO, rp[0], p),
								function(pe: per_st): pgr_st {
									if (!pe.ok)
										return pgr_error(pe.flp, pe.msg);
									return program_genForRange(pgen, stmt, rp[0], rp[1], rp[2]);
								}
							);
						}
					}
				}
			}
			return program_genForGeneric(pgen, stmt);
		}

		case ast_enumt.FOR2: {
			if (!pgs_for_check(state))
				throw new Error('Expecting state to be for structure');
			let pst: pgs_for_st = state;

			label_declare(pst.inc, prg.ops);
			op_inc(prg.ops, pst.idx_vlc);
			label_jump(pst.top, prg.ops);

			label_declare(pst.finish, prg.ops);
			symtbl_clearTemp(sym, pst.t1);
			symtbl_clearTemp(sym, pst.t2);
			if (!varloc_isnull(pst.t3))
				symtbl_clearTemp(sym, pst.t3);
			if (!varloc_isnull(pst.t4))
				symtbl_clearTemp(sym, pst.t4);
			if (!varloc_isnull(pst.val_vlc))
				symtbl_clearTemp(sym, pst.val_vlc);
			symtbl_clearTemp(sym, pst.idx_vlc);
			symtbl_popScope(sym);
			return pgr_pop();
		}

		case ast_enumt.LOOP1: {
			symtbl_pushScope(sym);
			let lcont = label_new('^loop_continue');
			let lbrk = label_new('^loop_break');
			sym.sc.lblContinue = lcont;
			sym.sc.lblBreak = lbrk;
			label_declare(lcont, prg.ops);
			return pgr_push(pgs_loop_new(lcont, lbrk));
		}

		case ast_enumt.LOOP2: {
			if (!pgs_loop_check(state))
				throw new Error('Expecting state to be loop structure');
			let pst: pgs_loop_st = state;

			label_jump(pst.lcont, prg.ops);
			label_declare(pst.lbrk, prg.ops);
			symtbl_popScope(sym);
			return pgr_pop();
		}

		case ast_enumt.GOTO: {
			for (let i = 0; i < sym.fr.lbls.length; i++){
				let lbl = sym.fr.lbls[i];
				if (lbl.name !== null && lbl.name === stmt.ident){
					label_jump(lbl, prg.ops);
					return pgr_ok();
				}
			}
			// label doesn't exist yet, so we'll need to create it
			let lbl = label_new(stmt.ident);
			label_jump(lbl, prg.ops);
			sym.fr.lbls.push(lbl);
			return pgr_ok();
		}

		case ast_enumt.IF1: {
			return pgr_push(pgs_if_new(null, label_new('^ifdone')));
		}

		case ast_enumt.IF2: {
			if (!pgs_if_check(state))
				throw new Error('Expecting state to be if struture');
			let pst: pgs_if_st = state;

			if (pst.nextcond !== null){
				symtbl_popScope(sym);
				label_jump(pst.ifdone, prg.ops);

				label_declare(pst.nextcond, prg.ops);
			}
			pst.nextcond = label_new('^nextcond');
			return checkPromise<per_st, pgr_st>(
				program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, stmt.cond),
				function(pr: per_st): pgr_st {
					if (!pgs_if_check(state))
						throw new Error('Expecting state to be if struture');
					let pst: pgs_if_st = state;

					if (!pr.ok)
						return pgr_error(pr.flp, pr.msg);

					if (pst.nextcond === null)
						throw new Error('If2 nextcond must not be null');
					label_jumpfalse(pst.nextcond, prg.ops, pr.vlc);
					symtbl_clearTemp(sym, pr.vlc);

					symtbl_pushScope(sym);
					return pgr_ok();
				}
			);
		}

		case ast_enumt.IF3: {
			if (!pgs_if_check(state))
				throw new Error('Expecting state to be if structure');
			let pst: pgs_if_st = state;

			symtbl_popScope(sym);
			label_jump(pst.ifdone, prg.ops);

			if (pst.nextcond === null)
				throw new Error('Next condition label must exist');
			label_declare(pst.nextcond, prg.ops);
			symtbl_pushScope(sym);
			return pgr_ok();
		}

		case ast_enumt.IF4: {
			if (!pgs_if_check(state))
				throw new Error('Expecting state to be if structure');
			let pst: pgs_if_st = state;

			symtbl_popScope(sym);
			label_declare(pst.ifdone, prg.ops);
			return pgr_pop();
		}

		case ast_enumt.INCLUDE: {
			throw new Error('Cannot generate code for include statement');
		}

		case ast_enumt.NAMESPACE1: {
			let smsg = symtbl_pushNamespace(sym, stmt.names);
			if (smsg !== null)
				return pgr_error(stmt.flp, smsg);
			return pgr_push(null);
		}

		case ast_enumt.NAMESPACE2: {
			symtbl_popNamespace(sym);
			return pgr_pop();
		}

		case ast_enumt.RETURN: {
			let nsn: nsname_st | null = null;
			let params: expr_st | null = null;
			let ex = stmt.ex;

			// check for tail call
			if (ex.type === expr_enum.CALL){
				if (ex.cmd.type !== expr_enum.NAMES)
					return pgr_error(ex.flp, 'Invalid call');
				let sl = symtbl_lookup(sym, ex.cmd.names);
				if (!sl.ok)
					return pgr_error(ex.flp, sl.msg);
				nsn = sl.nsn;
				params = ex.params;
			}
			else if (ex.type === expr_enum.NAMES){
				let sl = symtbl_lookup(sym, ex.names);
				if (!sl.ok)
					return pgr_error(ex.flp, sl.msg);
				nsn = sl.nsn;
			}

			// can only tail call local commands at the same lexical level
			if (nsn !== null && nsn.type === nsname_enumt.CMD_LOCAL &&
				nsn.fr.level + 1 === sym.fr.level){
				let argcount: number[] = [];
				let pe: per_st[] = [];
				let p: varloc_st[] = [];
				let nsn_lbl = nsn.lbl;
				return checkPromise<boolean, pgr_st>(
					program_evalCallArgcount(pgen, params, argcount, pe, p),
					function(eb: boolean): pgr_st {
						if (!eb){
							let pe0 = pe[0];
							if (pe0.ok)
								throw new Error('Expecting error message from evalCallArgcount');
							return pgr_error(pe0.flp, pe0.msg);
						}
						label_returntail(nsn_lbl, prg.ops, argcount[0]);
						for (let i = 0; i < argcount[0]; i++){
							op_arg(prg.ops, p[i]);
							symtbl_clearTemp(sym, p[i]);
						}
						return pgr_ok();
					}
				);
			}

			return checkPromise<per_st, pgr_st>(
				program_eval(pgen, pem_enum.CREATE, VARLOC_NULL, ex),
				function(pr: per_st): pgr_st {
					if (!pr.ok)
						return pgr_error(pr.flp, pr.msg);
					symtbl_clearTemp(sym, pr.vlc);
					op_return(prg.ops, pr.vlc);
					return pgr_ok();
				}
			);
		}

		case ast_enumt.USING: {
			let sl = symtbl_lookupfast(sym, stmt.names);
			let ns: namespace_st;
			if (!sl.ok){ // not found, so create it
				// don't have to free the error message because lookupfast doesn't create one
				let sf = symtbl_findNamespace(sym, stmt.names, stmt.names.length);
				if (!sf.ok)
					return pgr_error(stmt.flp, sf.msg);
				ns = sf.ns;
			}
			else{
				if (sl.nsn.type !== nsname_enumt.NAMESPACE)
					return pgr_error(stmt.flp, 'Expecting namespace');
				ns = sl.nsn.ns;
			}
			if (sym.sc.ns.usings.indexOf(ns) < 0)
				sym.sc.ns.usings.push(ns);
			return pgr_ok();
		}

		case ast_enumt.VAR:
			return handleVar(stmt);

		case ast_enumt.EVAL: {
			return checkPromise<per_st, pgr_st>(
				program_eval(pgen, sayexpr ? pem_enum.CREATE : pem_enum.EMPTY, VARLOC_NULL,
					stmt.ex),
				function(pr: per_st): pgr_st {
					if (!pr.ok)
						return pgr_error(pr.flp, pr.msg);
					if (sayexpr){
						let ts = symtbl_addTemp(sym);
						if (!ts.ok)
							return pgr_error(stmt.flp, ts.msg);
						op_parama(prg.ops, op_enum.SAY, ts.vlc, 1);
						op_arg(prg.ops, pr.vlc);
						symtbl_clearTemp(sym, pr.vlc);
						symtbl_clearTemp(sym, ts.vlc);
					}
					return pgr_ok();
				}
			);
		}

		case ast_enumt.LABEL: {
			let lbl: label_st | null = null;
			let found = false;
			for (let i = 0; i < sym.fr.lbls.length; i++){
				lbl = sym.fr.lbls[i];
				if (lbl.name !== null && lbl.name === stmt.ident){
					if (lbl.pos >= 0)
						return pgr_error(stmt.flp, 'Cannot redeclare label "' + stmt.ident + '"');
					found = true;
					break;
				}
			}
			if (!found){
				lbl = label_new(stmt.ident);
				sym.fr.lbls.push(lbl);
			}
			if (lbl === null)
				throw new Error('Label cannot be null');
			label_declare(lbl, prg.ops);
			return pgr_ok();
		}
	}
	throw new Error('Invalid AST type');
}

////////////////////////////////////////////////////////////////////////////////////////////////////
//
// runtime
//
////////////////////////////////////////////////////////////////////////////////////////////////////

//
// context
//

interface ccs_st {
	pc: number;
	frame: number;
	index: number;
	lex_index: number;
}

function ccs_new(pc: number, frame: number, index: number, lex_index: number): ccs_st {
	return { pc: pc, frame: frame, index: index, lex_index: lex_index };
}

interface lxs_st {
	vals: sink_val[];
	next: lxs_st | null;
}

function lxs_new(args: sink_val[], next: lxs_st | null){
	let ls: lxs_st = { vals: args.concat(), next: next };
	for (let i = args.length; i < 256; i++)
		ls.vals.push(SINK_NIL);
	return ls;
}

interface native_st {
	f_native: sink_native_f;
	hash: sink_u64;
}

function native_new(hash: sink_u64, f_native: sink_native_f): native_st {
	return { hash: hash, f_native: f_native };
}

interface context_st {
	user: any;
	natives: native_st[];

	prg: program_st;
	call_stk: ccs_st[];
	lex_stk: lxs_st[];
	user_hint: string[];
	ccs_avail: ccs_st[];
	lxs_avail: lxs_st[];

	io: sink_io_st;

	lex_index: number;
	pc: number;
	lastpc: number;
	timeout: number;
	timeout_left: number;

	rand_seed: number;
	rand_i: number;

	err: string | null;
	passed: boolean;
	failed: boolean;
	async: boolean;
}

function lxs_get(ctx: context_st, args: sink_val[], next: lxs_st | null): lxs_st {
	// TODO: speed test to see if lxs_avail is a speed boost
	if (ctx.lxs_avail.length > 0){
		let ls = ctx.lxs_avail.pop();
		if (typeof ls === 'undefined')
			throw new Error('No lxs structures available');
		ls.vals = args.concat();
		for (let i = args.length; i < 256; i++)
			ls.vals.push(SINK_NIL);
		ls.next = next;
		return ls;
	}
	return lxs_new(args, next);
}

function lxs_release(ctx: context_st, ls: lxs_st): void {
	ctx.lxs_avail.push(ls);
}

function ccs_get(ctx: context_st, pc: number, frame: number, index: number,
	lex_index: number): ccs_st {
	if (ctx.ccs_avail.length > 0){
		let c = ctx.ccs_avail.pop();
		if (typeof c === 'undefined')
			throw new Error('No ccs structures available');
		c.pc = pc;
		c.frame = frame;
		c.index = index;
		c.lex_index = lex_index;
		return c;
	}
	return ccs_new(pc, frame, index, lex_index);
}

function ccs_release(ctx: context_st, c: ccs_st): void {
	ctx.ccs_avail.push(c);
}

function context_native(ctx: context_st, hash: sink_u64, f_native: sink_native_f): void {
	if (ctx.prg.repl)
		ctx.natives.push(native_new(hash, f_native));
	else{
		for (let i = 0; i < ctx.natives.length; i++){
			let nat = ctx.natives[i];
			if (nat.hash === hash){
				// already defined, hash collision
				// TODO: rewrite error message for JS
				opi_abort(ctx,
					'Hash collision; cannot redefine native command ' +
					'(did you call sink_ctx_native twice for the same command?)');
				return;
			}
		}
	}
}

function context_new(prg: program_st, io: sink_io_st): context_st {
	let ctx: context_st = {
		user: null,
		natives: [],
		call_stk: [],
		lex_stk: [lxs_new([], null)],
		ccs_avail: [],
		lxs_avail: [],
		prg: prg,
		user_hint: [],
		io: io,
		lex_index: 0,
		pc: 0,
		lastpc: 0,
		timeout: 0,
		timeout_left: 0,
		rand_seed: 0,
		rand_i: 0,
		err: null,
		passed: false,
		failed: false,
		async: false
	};
	sink_rand_seedauto(ctx);
	return ctx;
}

function context_reset(ctx: context_st): void {
	// return to the top level
	while (ctx.call_stk.length > 0){
		let s = ctx.call_stk.pop();
		if (typeof s === 'undefined')
			throw new Error('Cannot unwind call stack');
		let lx = ctx.lex_stk[ctx.lex_index];
		if (lx.next === null)
			throw new Error('Bad lexical stack');
		ctx.lex_stk[ctx.lex_index] = lx.next;
		lxs_release(ctx, lx);
		ctx.lex_index = s.lex_index;
		ctx.pc = s.pc;
		ccs_release(ctx, s);
	}
	// reset variables and fast-forward to the end of the current program
	ctx.passed = false;
	ctx.failed = false;
	ctx.pc = ctx.prg.ops.length;
	ctx.timeout_left = ctx.timeout;
}

function var_get(ctx: context_st, frame: number, index: number): sink_val {
	// TODO: look at inlining this manually
	return ctx.lex_stk[frame].vals[index];
}

function var_set(ctx: context_st, frame: number, index: number, val: sink_val): void {
	// TODO: look at inlining this manually
	ctx.lex_stk[frame].vals[index] = val;
}

function arget(ar: sink_val, index: number): sink_val {
	if (sink_islist(ar))
		return index >= ar.length ? 0 : ar[index];
	return ar;
}

function arsize(ar: sink_val): number {
	if (sink_islist(ar))
		return ar.length;
	return 1;
}

const LT_ALLOWNIL = 1;
const LT_ALLOWNUM = 2;
const LT_ALLOWSTR = 4;

function oper_typemask(a: sink_val, mask: number): boolean {
	switch (sink_typeof(a)){
		case sink_type.NIL : return (mask & LT_ALLOWNIL) !== 0;
		case sink_type.NUM : return (mask & LT_ALLOWNUM) !== 0;
		case sink_type.STR : return (mask & LT_ALLOWSTR) !== 0;
		case sink_type.LIST: return false;
	}
}

function oper_typelist(a: sink_val, mask: number): boolean {
	if (sink_islist(a)){
		for (let i = 0; i < a.length; i++){
			if (!oper_typemask(a[i], mask))
				return false;
		}
		return true;
	}
	return oper_typemask(a, mask);
}

type unary_f = (v: sink_val) => sink_val;

function oper_un(a: sink_val, f_unary: unary_f): sink_val {
	if (sink_islist(a)){
		let ret = new sink_list();
		for (let i = 0; i < a.length; i++)
			ret.push(f_unary(a[i]));
		return ret;
	}
	return f_unary(a);
}

type binary_f = (a: sink_val, b: sink_val) => sink_val;

function oper_bin(a: sink_val, b: sink_val, f_binary: binary_f): sink_val {
	if (sink_islist(a) || sink_islist(b)){
		let m = Math.max(arsize(a), arsize(b));
		let ret = new sink_list();
		for (let i = 0; i < m; i++)
			ret.push(f_binary(arget(a, i), arget(b, i)));
		return ret;
	}
	return f_binary(a, b);
}

type trinary_f = (a: sink_val, b: sink_val, c: sink_val) => sink_val;

function oper_tri(a: sink_val, b: sink_val, c: sink_val, f_trinary: trinary_f): sink_val {
	if (sink_islist(a) || sink_islist(b) || sink_islist(c)){
		let m = Math.max(arsize(a), arsize(b), arsize(c));
		let ret = new sink_list();
		for (let i = 0; i < m; i++)
			ret.push(f_trinary(arget(a, i), arget(b, i), arget(c, i)));
		return ret;
	}
	return f_trinary(a, b, c);
}

function str_cmp(a: sink_str, b: sink_str): number {
	return a === b ? 0 : (a < b ? -1 : 1);
}

function opihelp_num_max(vals: sink_list, li: sink_list[]): sink_val {
	let max: sink_val = SINK_NIL;
	for (let i = 0; i < vals.length; i++){
		let v = vals[i];
		if (sink_isnum(v)){
			if (sink_isnil(max) || v > max)
				max = v;
		}
		else if (sink_islist(v)){
			if (li.indexOf(v) >= 0)
				return SINK_NIL;
			li.push(v);

			let lm = opihelp_num_max(v, li);
			if (!sink_isnil(lm) && (sink_isnil(max) || lm > max))
				max = lm;

			li.pop();
		}
	}
	return max;
}

function opi_num_max(vals: sink_list): sink_val {
	return opihelp_num_max(vals, []);
}

function opihelp_num_min(vals: sink_list, li: sink_list[]): sink_val {
	let min: sink_val = SINK_NIL;
	for (let i = 0; i < vals.length; i++){
		let v = vals[i];
		if (sink_isnum(v)){
			if (sink_isnil(min) || v < min)
				min = v;
		}
		else if (sink_islist(v)){
			if (li.indexOf(v) >= 0)
				return SINK_NIL;
			li.push(v);

			let lm = opihelp_num_min(v, li);
			if (!sink_isnil(lm) && (sink_isnil(min) || lm < min))
				min = lm;

			li.pop();
		}
	}
	return min;
}

function opi_num_min(vals: sink_list){
	return opihelp_num_min(vals, []);
}

function opi_num_base(num: number, len: number, base: number): sink_val {
	if (len > 256)
		len = 256;
	const digits = '0123456789ABCDEF';
	let buf = '';

	if (num < 0){
		buf = '-';
		num = -num;
	}

	if (base === 16)
		buf += '0x';
	else if (base === 8)
		buf += '0c';
	else if (base === 2)
		buf += '0b';
	else
		throw new Error('Bad base for number conversion');

	let buf2 = '';
	let bodysize = 0;
	let nint = Math.floor(num);
	let nfra = num - nint;
	while (nint > 0 && bodysize < 50){
		buf2 += digits.charAt(nint % base);
		bodysize++;
		nint = Math.floor(nint / base);
	}
	let bi = 0;
	while (bodysize + bi < len && bodysize + bi < 32 && buf.length < 50){
		buf += '0';
		bi++;
	}
	if (bodysize > 0)
		buf += buf2;
	else if (len <= 0)
		buf += '0';

	if (nfra > 0.00001){
		buf += '.';
		let i = 0;
		while (nfra > 0.00001 && i < 16){
			nfra *= base;
			nint = Math.floor(nfra);
			buf += digits.charAt(nint);
			nfra -= nint;
			i++;
		}
	}

	return buf;
}

export function sink_rand_seedauto(ctx: sink_ctx): void {
	ctx.rand_seed = (Math.random() * 0x10000000) | 0;
	ctx.rand_i = (Math.random() * 0x10000000) | 0;
	for (let i = 0; i < 1000; i++)
		sink_rand_int(ctx);
	ctx.rand_i = 0;
}

export function sink_rand_seed(ctx: sink_ctx, n: number): void {
	ctx.rand_seed = n | 0;
	ctx.rand_i = 0;
}

export function sink_rand_int(ctx: sink_ctx): number {
	const m = 0x5bd1e995;
	let k = (Math as any).imul(ctx.rand_i, m);
	ctx.rand_i = (ctx.rand_i + 1) | 0;
	ctx.rand_seed = (Math as any).imul(k ^ (k >>> 24) ^ (Math as any).imul(ctx.rand_seed, m), m);
	let res = (ctx.rand_seed ^ (ctx.rand_seed >>> 13)) | 0;
	if (res < 0)
		return res + 0x100000000;
	return res;
}

export function sink_rand_num(ctx: sink_ctx): number {
	var M1 = sink_rand_int(ctx);
	var M2 = sink_rand_int(ctx);
	var view = new DataView(new ArrayBuffer(8));
	view.setInt32(0, (M1 << 20) | (M2 >>> 12), true);
	view.setInt32(4, 0x3FF00000 | (M1 >>> 12), true);
	return view.getFloat64(0, true) - 1;
}

export function sink_rand_getstate(ctx: sink_ctx): sink_list {
	// slight goofy logic to convert int32 to uint32
	if (ctx.rand_i < 0){
		if (ctx.rand_seed < 0)
			return new sink_list(ctx.rand_seed + 0x100000000, ctx.rand_i + 0x100000000);
		return new sink_list(ctx.rand_seed, ctx.rand_i + 0x100000000);
	}
	else if (ctx.rand_seed < 0)
		return new sink_list(ctx.rand_seed + 0x100000000, ctx.rand_i);
	return new sink_list(ctx.rand_seed, ctx.rand_i);
}

export function sink_rand_setstate(ctx: sink_ctx, a: sink_val): void {
	if (!sink_islist(a) || a.length < 2){
		opi_abort(ctx, 'Expecting list of two integers');
		return;
	}
	let A = a[0];
	let B = a[1];
	if (!sink_isnum(A) || !sink_isnum(B)){
		opi_abort(ctx, 'Expecting list of two integers');
		return;
	}
	ctx.rand_seed = A | 0;
	ctx.rand_i = B | 0;
}

export function sink_rand_pick(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list');
		return SINK_NIL;
	}
	if (a.length <= 0)
		return SINK_NIL;
	return a[Math.floor(sink_rand_num(ctx) * a.length)];
}

export function sink_rand_shuffle(ctx: sink_ctx, a: sink_val): void {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list');
		return;
	}
	let m = a.length;
	while (m > 1){
		let i = Math.floor(sink_rand_num(ctx) * m);
		m--;
		if (m != i){
			let t = a[m];
			a[m] = a[i];
			a[i] = t;
		}
	}
}

export function sink_str_new(ctx: sink_ctx, vals: sink_val[]): sink_val {
	return sink_list_joinplain(vals, ' ');
}

export function sink_str_split(ctx: sink_ctx, a: sink_val, b: sink_val): sink_val {
	if ((!sink_isstr(a) && !sink_isnum(a)) || (!sink_isstr(b) && !sink_isnum(b))){
		opi_abort(ctx, 'Expecting strings');
		return SINK_NIL;
	}
	let haystack = sink_tostr(a);
	let needle = sink_tostr(b);
	let result = new sink_list();
	result.push.apply(result, haystack.split(needle));
	return result;
}

export function sink_str_replace(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val): sink_val {
	let ls = sink_str_split(ctx, a, b);
	if (ctx.failed)
		return SINK_NIL;
	return sink_list_join(ctx, ls, c);
}

export function sink_str_find(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val): sink_val {
	let hx: number;
	if (sink_isnil(c))
		hx = 0;
	else if (sink_isnum(c))
		hx = c;
	else{
		opi_abort(ctx, 'Expecting number');
		return SINK_NIL;
	}
	if ((!sink_isstr(a) && !sink_isnum(a)) || (!sink_isstr(b) && !sink_isnum(b))){
		opi_abort(ctx, 'Expecting strings');
		return SINK_NIL;
	}
	let haystack = sink_tostr(a);
	let needle = sink_tostr(b);
	if (needle.length <= 0)
		return 0;

	let pos = haystack.indexOf(needle);
	if (pos >= 0)
		return pos;
	return SINK_NIL;
}

export function sink_str_rfind(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val): sink_val {
	let hx: number;
	if (sink_isnum(c))
		hx = c;
	else if (!sink_isnil(c)){
		opi_abort(ctx, 'Expecting number');
		return SINK_NIL;
	}
	if ((!sink_isstr(a) && !sink_isnum(a)) || (!sink_isstr(b) && !sink_isnum(b))){
		opi_abort(ctx, 'Expecting strings');
		return SINK_NIL;
	}
	let haystack = sink_tostr(a);
	let needle = sink_tostr(b);

	if (needle.length <= 0)
		return haystack.length;

	if (sink_isnil(c))
		hx = haystack.length - needle.length;

	let pos = haystack.lastIndexOf(needle);
	if (pos >= 0)
		return pos;
	return SINK_NIL;
}

export function sink_str_begins(ctx: sink_ctx, a: sink_val, b: sink_val): boolean {
	if ((!sink_isstr(a) && !sink_isnum(a)) || (!sink_isstr(b) && !sink_isnum(b))){
		opi_abort(ctx, 'Expecting strings');
		return false;
	}
	let s1 = sink_tostr(a);
	let s2 = sink_tostr(b);
	return s2.length == 0 || (s1.length >= s2.length && s1.substr(0, s2.length) === s2);
}

export function sink_str_ends(ctx: sink_ctx, a: sink_val, b: sink_val): boolean {
	if ((!sink_isstr(a) && !sink_isnum(a)) || (!sink_isstr(b) && !sink_isnum(b))){
		opi_abort(ctx, 'Expecting strings');
		return false;
	}
	let s1 = sink_tostr(a);
	let s2 = sink_tostr(b);
	return s2.length === 0 || (s1.length >= s2.length && s1.substr(-s2.length) === s2);
}

export function sink_str_pad(ctx: sink_ctx, a: sink_val, b: number): sink_val {
	if (!sink_isstr(a) && !sink_isnum(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	let s = sink_tostr(a);
	if (b < 0){ // left pad
		b = -b;
		if (s.length >= b)
			return s;
		return (new Array(b + 1)).join(' ') + s;
	}
	else{ // right pad
		if (s.length >= b)
			return s;
		return s + (new Array(b + 1)).join(' ');
	}
}

function opihelp_str_lower(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_isstr(a) && !sink_isnum(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	let s = sink_tostr(a);
	return s.replace(/[A-Z]/g, function(ch: string): string { return ch.toLowerCase(); });
}

function opihelp_str_upper(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_isstr(a) && !sink_isnum(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	let s = sink_tostr(a);
	return s.replace(/[a-z]/g, function(ch: string): string { return ch.toUpperCase(); });
}

function opihelp_str_trim(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_isstr(a) && !sink_isnum(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	let s = sink_tostr(a);
	return s.replace(/^[\x09\x0A\x0B\x0C\x0D\x20]*|[\x09\x0A\x0B\x0C\x0D\x20]*$/g, '');
}

function opihelp_str_rev(ctx: sink_ctx, a: sink_val): sink_val{
	if (!sink_isstr(a) && !sink_isnum(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	let s = sink_tostr(a);
	if (s.length <= 0)
		return a;
	return s.split('').reverse().join('');
}

function opi_str_unop(ctx: sink_ctx, a: sink_val,
	single: (ctx: sink_ctx, a: sink_val) => sink_val): sink_val {
	if (sink_islist(a)){
		let ret = new sink_list();
		for (let i = 0; i < a.length; i++)
			ret.push(single(ctx, a[i]));
		return ret;
	}
	return single(ctx, a);
}

// allow unary string commands to work on lists too
export function sink_str_lower(ctx: sink_ctx, a: sink_val): sink_val {
	return opi_str_unop(ctx, a, opihelp_str_lower);
}
export function sink_str_upper(ctx: sink_ctx, a: sink_val): sink_val {
	return opi_str_unop(ctx, a, opihelp_str_upper);
}
export function sink_str_trim(ctx: sink_ctx, a: sink_val): sink_val {
	return opi_str_unop(ctx, a, opihelp_str_trim);
}
export function sink_str_rev(ctx: sink_ctx, a: sink_val): sink_val {
	return opi_str_unop(ctx, a, opihelp_str_rev);
}

export function sink_str_rep(ctx: sink_ctx, a: sink_val, rep: number): sink_val {
	if (!sink_isstr(a) && !sink_isnum(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	if (rep <= 0)
		return '';
	else if (rep === 1)
		return a;
	let s = sink_tostr(a);
	if (s.length <= 0)
		return s;
	let size = s.length * rep;
	if (size > 100000000){
		opi_abort(ctx, 'Constructed string is too large');
		return SINK_NIL;
	}
	return (new Array(rep + 1)).join(s);
}

export function sink_str_list(ctx: sink_ctx, a: sink_val): sink_val{
	if (!sink_isstr(a) && !sink_isnum(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	let s = sink_tostr(a);
	let r = new sink_list();
	for (let i = 0; i < s.length; i++)
		r.push(s.charCodeAt(i));
	return r;
}

export function sink_str_byte(ctx: sink_ctx, a: sink_val, b: number): sink_val {
	if (!sink_isstr(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	if (b < 0)
		b += a.length;
	if (b < 0 || b >= a.length)
		return SINK_NIL;
	return a.charCodeAt(b);
}

export function sink_str_hash(ctx: sink_ctx, a: sink_val, seed: number): sink_val {
	if (!sink_isstr(a) && !sink_isnum(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	let s = sink_tostr(a);
	let out = sink_str_hashplain(s, seed);
	return new sink_list(out[0], out[1], out[2], out[3]);
}

// 1   7  U+00000  U+00007F  0xxxxxxx
// 2  11  U+00080  U+0007FF  110xxxxx  10xxxxxx
// 3  16  U+00800  U+00FFFF  1110xxxx  10xxxxxx  10xxxxxx
// 4  21  U+10000  U+10FFFF  11110xxx  10xxxxxx  10xxxxxx  10xxxxxx

function opihelp_codepoint(b: sink_val): boolean {
	return sink_isnum(b) && // must be a number
		Math.floor(b) == b && // must be an integer
		b >= 0 && b < 0x110000 && // must be within total range
		(b < 0xD800 || b >= 0xE000); // must not be a surrogate
}

export function sink_utf8_valid(ctx: sink_ctx, a: sink_val): boolean {
	if (sink_isstr(a)){
		let state = 0;
		let codepoint = 0;
		let min = 0;
		for (let i = 0; i < a.length; i++){
			let b = a.charCodeAt(i);
			if (state == 0){
				if (b < 0x80) // 0x00 to 0x7F
					continue;
				else if (b < 0xC0) // 0x80 to 0xBF
					return false;
				else if (b < 0xE0){ // 0xC0 to 0xDF
					codepoint = b & 0x1F;
					min = 0x80;
					state = 1;
				}
				else if (b < 0xF0){ // 0xE0 to 0xEF
					codepoint = b & 0x0F;
					min = 0x800;
					state = 2;
				}
				else if (b < 0xF8){ // 0xF0 to 0xF7
					codepoint = b & 0x07;
					min = 0x10000;
					state = 3;
				}
				else
					return false;
			}
			else{
				if (b < 0x80 || b >= 0xC0)
					return false;
				codepoint = (codepoint << 6) | (b & 0x3F);
				state--;
				if (state == 0){ // codepoint finished, check if invalid
					if (codepoint < min || // no overlong
						codepoint >= 0x110000 || // no huge
						(codepoint >= 0xD800 && codepoint < 0xE000)) // no surrogates
						return false;
				}
			}
		}
		return state == 0;
	}
	else if (sink_islist(a)){
		for (let i = 0; i < a.length; i++){
			if (!opihelp_codepoint(a[i]))
				return false;
		}
		return true;
	}
	return false;
}

export function sink_utf8_list(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_isstr(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	let res = new sink_list();
	let state = 0;
	let codepoint = 0;
	let min = 0;
	for (let i = 0; i < a.length; i++){
		let b = a.charCodeAt(i);
		if (state == 0){
			if (b < 0x80) // 0x00 to 0x7F
				res.push(b);
			else if (b < 0xC0){ // 0x80 to 0xBF
				opi_abort(ctx, 'Invalid UTF-8 string');
				return SINK_NIL;
			}
			else if (b < 0xE0){ // 0xC0 to 0xDF
				codepoint = b & 0x1F;
				min = 0x80;
				state = 1;
			}
			else if (b < 0xF0){ // 0xE0 to 0xEF
				codepoint = b & 0x0F;
				min = 0x800;
				state = 2;
			}
			else if (b < 0xF8){ // 0xF0 to 0xF7
				codepoint = b & 0x07;
				min = 0x10000;
				state = 3;
			}
			else{
				opi_abort(ctx, 'Invalid UTF-8 string');
				return SINK_NIL;
			}
		}
		else{
			if (b < 0x80 || b >= 0xC0){
				opi_abort(ctx, 'Invalid UTF-8 string');
				return SINK_NIL;
			}
			codepoint = (codepoint << 6) | (b & 0x3F);
			state--;
			if (state == 0){ // codepoint finished, check if invalid
				if (codepoint < min || // no overlong
					codepoint >= 0x110000 || // no huge
					(codepoint >= 0xD800 && codepoint < 0xE000)){ // no surrogates
					opi_abort(ctx, 'Invalid UTF-8 string');
					return SINK_NIL;
				}
				res.push(codepoint);
			}
		}
	}
	return res;
}

export function sink_utf8_str(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, "Expecting list");
		return SINK_NIL;
	}
	let bytes = '';
	for (let i = 0; i < a.length; i++){
		let b = a[i];
		if (!opihelp_codepoint(b)){
			opi_abort(ctx, 'Invalid list of codepoints');
			return SINK_NIL;
		}
		if (typeof b !== 'number')
			throw new Error('Expecting list of numbers for utf8.str');
		if (b < 0x80)
			bytes += String.fromCharCode(b);
		else if (b < 0x800){
			bytes += String.fromCharCode(0xC0 | (b >> 6));
			bytes += String.fromCharCode(0x80 | (b & 0x3F));
		}
		else if (b < 0x10000){
			bytes += String.fromCharCode(0xE0 | (b >> 12));
			bytes += String.fromCharCode(0x80 | ((b >> 6) & 0x3F));
			bytes += String.fromCharCode(0x80 | (b & 0x3F));
		}
		else{
			bytes += String.fromCharCode(0xF0 | (b >> 18));
			bytes += String.fromCharCode(0x80 | ((b >> 12) & 0x3F));
			bytes += String.fromCharCode(0x80 | ((b >> 6) & 0x3F));
			bytes += String.fromCharCode(0x80 | (b & 0x3F));
		}
	}
	return bytes;
}

export function sink_struct_size(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_islist(a))
		return SINK_NIL;
	let tot = 0;
	for (let i = 0; i < a.length; i++){
		let b = a[i];
		if (!sink_isnum(b))
			return SINK_NIL;
		switch (b){
			case struct_enum.U8  : tot += 1; break;
			case struct_enum.U16 : tot += 2; break;
			case struct_enum.UL16: tot += 2; break;
			case struct_enum.UB16: tot += 2; break;
			case struct_enum.U32 : tot += 4; break;
			case struct_enum.UL32: tot += 4; break;
			case struct_enum.UB32: tot += 4; break;
			case struct_enum.S8  : tot += 1; break;
			case struct_enum.S16 : tot += 2; break;
			case struct_enum.SL16: tot += 2; break;
			case struct_enum.SB16: tot += 2; break;
			case struct_enum.S32 : tot += 4; break;
			case struct_enum.SL32: tot += 4; break;
			case struct_enum.SB32: tot += 4; break;
			case struct_enum.F32 : tot += 4; break;
			case struct_enum.FL32: tot += 4; break;
			case struct_enum.FB32: tot += 4; break;
			case struct_enum.F64 : tot += 8; break;
			case struct_enum.FL64: tot += 8; break;
			case struct_enum.FB64: tot += 8; break;
			default:
				return SINK_NIL;
		}
	}
	return tot <= 0 ? SINK_NIL : tot;
}

let LE: boolean = (function(){ // detect native endianness
	var b = new ArrayBuffer(2);
	(new DataView(b)).setInt16(0, 1, true);
	return (new Int16Array(b))[0] === 1;
})();

export function sink_struct_str(ctx: sink_ctx, a: sink_val, b: sink_val): sink_val {
	if (!sink_islist(a) || !sink_islist(b)){
		opi_abort(ctx, 'Expecting list');
		return SINK_NIL;
	}
	if (b.length <= 0 || a.length % b.length != 0){
		opi_abort(ctx, 'Invalid conversion');
		return SINK_NIL;
	}
	let arsize = a.length / b.length;
	let res = '';
	for (let ar = 0; ar < arsize; ar++){
		for (let i = 0; i < b.length; i++){
			let d = a[i + ar * b.length];
			let t = b[i];
			if (!sink_isnum(d) || !sink_isnum(t)){
				opi_abort(ctx, 'Invalid conversion');
				return SINK_NIL;
			}
			if (t === struct_enum.U8 || t === struct_enum.S8)
				res += String.fromCharCode(d & 0xFF);
			else if (t === struct_enum.UL16 || t === struct_enum.SL16 ||
				(LE && (t === struct_enum.U16 || t === struct_enum.S16))){
				dview.setUint16(0, d & 0xFFFF, true);
				res += String.fromCharCode(dview.getUint8(0));
				res += String.fromCharCode(dview.getUint8(1));
			}
			else if (t === struct_enum.UB16 || t === struct_enum.SB16 ||
				(!LE && (t === struct_enum.U16 || t === struct_enum.S16))){
				dview.setUint16(0, d & 0xFFFF, false);
				res += String.fromCharCode(dview.getUint8(0));
				res += String.fromCharCode(dview.getUint8(1));
			}
			else if (t === struct_enum.UL32 || t === struct_enum.SL32 ||
				(LE && (t === struct_enum.U32 || t === struct_enum.S32))){
				dview.setUint32(0, d & 0xFFFFFFFF, true);
				res += String.fromCharCode(dview.getUint8(0));
				res += String.fromCharCode(dview.getUint8(1));
				res += String.fromCharCode(dview.getUint8(2));
				res += String.fromCharCode(dview.getUint8(3));
			}
			else if (t === struct_enum.UB32 || t === struct_enum.SB32 ||
				(!LE && (t === struct_enum.U32 || t === struct_enum.S32))){
				dview.setUint32(0, d & 0xFFFFFFFF, false);
				res += String.fromCharCode(dview.getUint8(0));
				res += String.fromCharCode(dview.getUint8(1));
				res += String.fromCharCode(dview.getUint8(2));
				res += String.fromCharCode(dview.getUint8(3));
			}
			else if (t === struct_enum.FL32 || (LE && t === struct_enum.F32)){
				dview.setFloat32(0, d, true);
				res += String.fromCharCode(dview.getUint8(0));
				res += String.fromCharCode(dview.getUint8(1));
				res += String.fromCharCode(dview.getUint8(2));
				res += String.fromCharCode(dview.getUint8(3));
			}
			else if (t === struct_enum.FB32 || (!LE && t === struct_enum.F32)){
				dview.setFloat32(0, d, false);
				res += String.fromCharCode(dview.getUint8(0));
				res += String.fromCharCode(dview.getUint8(1));
				res += String.fromCharCode(dview.getUint8(2));
				res += String.fromCharCode(dview.getUint8(3));
			}
			else if (t === struct_enum.FL64 || (LE && t === struct_enum.F64)){
				dview.setFloat64(0, d, true);
				res += String.fromCharCode(dview.getUint8(0));
				res += String.fromCharCode(dview.getUint8(1));
				res += String.fromCharCode(dview.getUint8(2));
				res += String.fromCharCode(dview.getUint8(3));
				res += String.fromCharCode(dview.getUint8(4));
				res += String.fromCharCode(dview.getUint8(5));
				res += String.fromCharCode(dview.getUint8(6));
				res += String.fromCharCode(dview.getUint8(7));
			}
			else if (t === struct_enum.FB64 || (!LE && t === struct_enum.F64)){
				dview.setFloat64(0, d, false);
				res += String.fromCharCode(dview.getUint8(0));
				res += String.fromCharCode(dview.getUint8(1));
				res += String.fromCharCode(dview.getUint8(2));
				res += String.fromCharCode(dview.getUint8(3));
				res += String.fromCharCode(dview.getUint8(4));
				res += String.fromCharCode(dview.getUint8(5));
				res += String.fromCharCode(dview.getUint8(6));
				res += String.fromCharCode(dview.getUint8(7));
			}
			else{
				opi_abort(ctx, 'Invalid conversion');
				return SINK_NIL;
			}
		}
	}
	return res;
}

export function sink_struct_list(ctx: sink_ctx, a: sink_val, b: sink_val): sink_val {
	if (!sink_isstr(a)){
		opi_abort(ctx, 'Expecting string');
		return SINK_NIL;
	}
	if (!sink_islist(b)){
		opi_abort(ctx, 'Expecting list');
		return SINK_NIL;
	}
	let size = sink_struct_size(ctx, b);
	if (!sink_isnum(size) || a.length % size !== 0){
		opi_abort(ctx, 'Invalid conversion');
		return SINK_NIL;
	}
	let res = new sink_list();
	let pos = 0;
	while (pos < a.length){
		for (let i = 0; i < b.length; i++){
			let t = b[i];
			if (!sink_isnum(t)){
				opi_abort(ctx, 'Invalid conversion');
				return SINK_NIL;
			}
			if (t === struct_enum.U8){
				dview.setUint8(0, a.charCodeAt(pos++));
				res.push(dview.getUint8(0));
			}
			else if (t === struct_enum.S8){
				dview.setUint8(0, a.charCodeAt(pos++));
				res.push(dview.getInt8(0));
			}
			else if (t === struct_enum.UL16 || (LE && t === struct_enum.U16)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				res.push(dview.getUint16(0, true));
			}
			else if (t === struct_enum.SL16 || (LE && t === struct_enum.S16)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				res.push(dview.getInt16(0, true));
			}
			else if (t === struct_enum.UB16 || (!LE && t === struct_enum.U16)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				res.push(dview.getUint16(0, false));
			}
			else if (t === struct_enum.SB16 || (!LE && t === struct_enum.S16)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				res.push(dview.getInt16(0, false));
			}
			else if (t === struct_enum.UL32 || (LE && t === struct_enum.U32)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				dview.setUint8(2, a.charCodeAt(pos++)); dview.setUint8(3, a.charCodeAt(pos++));
				res.push(dview.getUint32(0, true));
			}
			else if (t === struct_enum.SL32 || (LE && t === struct_enum.S32)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				dview.setUint8(2, a.charCodeAt(pos++)); dview.setUint8(3, a.charCodeAt(pos++));
				res.push(dview.getInt32(0, true));
			}
			else if (t === struct_enum.UB32 || (!LE && t === struct_enum.U32)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				dview.setUint8(2, a.charCodeAt(pos++)); dview.setUint8(3, a.charCodeAt(pos++));
				res.push(dview.getUint32(0, false));
			}
			else if (t === struct_enum.SB32 || (!LE && t === struct_enum.S32)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				dview.setUint8(2, a.charCodeAt(pos++)); dview.setUint8(3, a.charCodeAt(pos++));
				res.push(dview.getInt32(0, false));
			}
			else if (t === struct_enum.FL32 || (LE && t === struct_enum.F32)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				dview.setUint8(2, a.charCodeAt(pos++)); dview.setUint8(3, a.charCodeAt(pos++));
				res.push(dview.getFloat32(0, true));
			}
			else if (t === struct_enum.FB32 || (!LE && t === struct_enum.F32)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				dview.setUint8(2, a.charCodeAt(pos++)); dview.setUint8(3, a.charCodeAt(pos++));
				res.push(dview.getFloat32(0, false));
			}
			else if (t === struct_enum.FL64 || (LE && t === struct_enum.F64)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				dview.setUint8(2, a.charCodeAt(pos++)); dview.setUint8(3, a.charCodeAt(pos++));
				dview.setUint8(4, a.charCodeAt(pos++)); dview.setUint8(5, a.charCodeAt(pos++));
				dview.setUint8(6, a.charCodeAt(pos++)); dview.setUint8(7, a.charCodeAt(pos++));
				res.push(dview.getFloat64(0, true));
			}
			else if (t === struct_enum.FB64 || (!LE && t === struct_enum.F64)){
				dview.setUint8(0, a.charCodeAt(pos++)); dview.setUint8(1, a.charCodeAt(pos++));
				dview.setUint8(2, a.charCodeAt(pos++)); dview.setUint8(3, a.charCodeAt(pos++));
				dview.setUint8(4, a.charCodeAt(pos++)); dview.setUint8(5, a.charCodeAt(pos++));
				dview.setUint8(6, a.charCodeAt(pos++)); dview.setUint8(7, a.charCodeAt(pos++));
				res.push(dview.getFloat64(0, false));
			}
			else{
				opi_abort(ctx, 'Invalid conversion');
				return SINK_NIL;
			}
		}
	}
	return res;
}

export function sink_struct_isLE(): boolean {
	return LE;
}

// operators
function unop_num_neg(a: sink_val): sink_val {
	return -(a as number);
}

function unop_tonum(a: sink_val): sink_val {
	if (sink_isnum(a))
		return a;
	if (!sink_isstr(a))
		return SINK_NIL;

	let npi = numpart_new();
	enum tonum_enum {
		START,
		NEG,
		N0,
		N2,
		BODY,
		FRAC,
		EXP,
		EXP_BODY
	}
	let state = tonum_enum.START;
	let hasval = false;
	for (let i = 0; i < a.length; i++){
		let ch = a.charAt(i);
		switch (state){
			case tonum_enum.START:
				if (isNum(ch)){
					hasval = true;
					npi.val = toHex(ch);
					if (npi.val === 0)
						state = tonum_enum.N0;
					else
						state = tonum_enum.BODY;
				}
				else if (ch === '-'){
					npi.sign = -1;
					state = tonum_enum.NEG;
				}
				else if (ch === '.')
					state = tonum_enum.FRAC;
				else if (!isSpace(ch))
					return SINK_NIL;
				break;

			case tonum_enum.NEG:
				if (isNum(ch)){
					hasval = true;
					npi.val = toHex(ch);
					if (npi.val === 0)
						state = tonum_enum.N0;
					else
						state = tonum_enum.BODY;
				}
				else if (ch === '.')
					state = tonum_enum.FRAC;
				else
					return SINK_NIL;
				break;

			case tonum_enum.N0:
				if (ch === 'b'){
					npi.base = 2;
					state = tonum_enum.N2;
				}
				else if (ch === 'c'){
					npi.base = 8;
					state = tonum_enum.N2;
				}
				else if (ch === 'x'){
					npi.base = 16;
					state = tonum_enum.N2;
				}
				else if (ch === '_')
					state = tonum_enum.BODY;
				else if (ch === '.')
					state = tonum_enum.FRAC;
				else if (ch === 'e' || ch === 'E')
					state = tonum_enum.EXP;
				else if (isNum(ch)){
					// number has a leading zero, so just ignore it
					// (not valid in sink, but valid at runtime for flexibility)
					npi.val = toHex(ch);
					state = tonum_enum.BODY;
				}
				else
					return 0;
				break;

			case tonum_enum.N2:
				if (isHex(ch)){
					npi.val = toHex(ch);
					if (npi.val >= npi.base)
						return sink_num(0);
					state = tonum_enum.BODY;
				}
				else if (ch !== '_')
					return sink_num(0);
				break;

			case tonum_enum.BODY:
				if (ch === '.')
					state = tonum_enum.FRAC;
				else if ((npi.base === 10 && (ch === 'e' || ch === 'E')) ||
					(npi.base !== 10 && (ch === 'p' || ch === 'P')))
					state = tonum_enum.EXP;
				else if (isHex(ch)){
					let v = toHex(ch);
					if (v >= npi.base)
						return numpart_calc(npi);
					else
						npi.val = npi.val * npi.base + v;
				}
				else if (ch !== '_')
					return numpart_calc(npi);
				break;

			case tonum_enum.FRAC:
				if (hasval && ((npi.base === 10 && (ch === 'e' || ch === 'E')) ||
					(npi.base !== 10 && (ch === 'p' || ch === 'P'))))
					state = tonum_enum.EXP;
				else if (isHex(ch)){
					hasval = true;
					let v = toHex(ch);
					if (v >= npi.base)
						return numpart_calc(npi);
					npi.frac = npi.frac * npi.base + v;
					npi.flen++;
				}
				else if (ch !== '_')
					return numpart_calc(npi);
				break;

			case tonum_enum.EXP:
				if (ch !== '_'){
					npi.esign = ch === '-' ? -1 : 1;
					state = tonum_enum.EXP_BODY;
					if (ch !== '+' && ch !== '-')
						i--;
				}
				break;

			case tonum_enum.EXP_BODY:
				if (isNum(ch))
					npi.eval = npi.eval * 10.0 + toHex(ch);
				else if (ch !== '_')
					return numpart_calc(npi);
				break;
		}
	}
	if (state === tonum_enum.START || state === tonum_enum.NEG || (state === tonum_enum.FRAC && !hasval))
		return SINK_NIL;
	return numpart_calc(npi);
}

let unop_num_abs = Math.abs as (a: sink_val) => sink_val;

function unop_num_sign(a: sink_val): sink_val {
	return isNaN(a as number) ? SINK_NAN : ((a as number) < 0 ? -1 : ((a as number) > 0 ? 1 : 0));
}

let unop_num_floor = Math.floor as (a: sink_val) => sink_val;
let unop_num_ceil  = Math.ceil  as (a: sink_val) => sink_val;
let unop_num_round = Math.round as (a: sink_val) => sink_val;
let unop_num_trunc = (Math as any).trunc as (a: sink_val) => sink_val;

function unop_num_isnan(ctx: sink_ctx, a: sink_val): sink_val {
	return sink_bool(isNaN(a as number));
}

function unop_num_isfinite(ctx: sink_ctx, a: sink_val): sink_val {
	return sink_bool(isFinite(a as number));
}

let unop_num_sin = Math.sin  as (a: sink_val) => sink_val;
let unop_num_cos = Math.cos  as (a: sink_val) => sink_val;
let unop_num_tan = Math.tan  as (a: sink_val) => sink_val;
let unop_num_asi = Math.asin as (a: sink_val) => sink_val;
let unop_num_aco = Math.acos as (a: sink_val) => sink_val;
let unop_num_ata = Math.atan as (a: sink_val) => sink_val;
let unop_num_log = Math.log  as (a: sink_val) => sink_val;
let unop_num_log2  = (Math as any).log2  as (a: sink_val) => sink_val;
let unop_num_log10 = (Math as any).log10 as (a: sink_val) => sink_val;
let unop_num_exp = Math.exp as (a: sink_val) => sink_val;

function binop_num_add(a: sink_val, b: sink_val): sink_val {
	return (a as number) + (b as number);
}

function binop_num_sub(a: sink_val, b: sink_val): sink_val {
	return (a as number) - (b as number);
}

function binop_num_mul(a: sink_val, b: sink_val): sink_val {
	return (a as number) * (b as number);
}

function binop_num_div(a: sink_val, b: sink_val): sink_val {
	return (a as number) / (b as number);
}

function binop_num_mod(a: sink_val, b: sink_val): sink_val {
	return (a as number) % (b as number);
}

let binop_num_pow   = Math.pow   as (a: sink_val) => sink_val;
let binop_num_atan2 = Math.atan2 as (a: sink_val) => sink_val;

function binop_num_hex(a: sink_val, b: sink_val): sink_val {
	return isNaN(a as number) ? SINK_NAN :
		opi_num_base(a as number, sink_isnil(b) ? 0 : (b as number), 16);
}

function binop_num_oct(a: sink_val, b: sink_val): sink_val {
	return isNaN(a as number) ? SINK_NAN :
		opi_num_base(a as number, sink_isnil(b) ? 0 : (b as number), 8);
}

function binop_num_bin(a: sink_val, b: sink_val): sink_val {
	return isNaN(a as number) ? SINK_NAN :
		opi_num_base(a as number, sink_isnil(b) ? 0 : (b as number), 2);
}

function triop_num_clamp(a: sink_val, b: sink_val, c: sink_val): sink_val {
	return isNaN(a as number) || isNaN(b as number) || isNaN(c as number) ? SINK_NAN :
		((a as number) < (b as number) ? (b as number) :
			((a as number) > (c as number) ? (c as number) : (a as number)));
}

function triop_num_lerp(a: sink_val, b: sink_val, c: sink_val): sink_val {
	return (a as number) + ((b as number) - (a as number)) * (c as number);
}

function unop_int_new(a: sink_val): sink_val {
	return (a as number) | 0;
}

function unop_int_not(a: sink_val): sink_val {
	return ~((a as number) | 0);
}

let unop_int_clz = (Math as any).clz32 as (a: sink_val) => sink_val;

function unop_int_pop(a: sink_val): sink_val {
	let n = (a as number) | 0;
	n = ((n & 0xAAAAAAAA) >>  1) + (n & 0x55555555);
	n = ((n & 0xCCCCCCCC) >>  2) + (n & 0x33333333);
	n = ((n & 0xF0F0F0F0) >>  4) + (n & 0x0F0F0F0F);
	n = ((n & 0xFF00FF00) >>  8) + (n & 0x00FF00FF);
	return ((n & 0xFFFF0000) >> 16) + (n & 0x0000FFFF);
}

function unop_int_bswap(a: sink_val): sink_val {
	let n = (a as number) | 0;
	return (n >> 24) | ((n >> 8) & 0xFF00) | ((n << 8) & 0xFF0000) | (n << 24);
}

function binop_int_and(a: sink_val, b: sink_val): sink_val {
	return ((a as number) | 0) & ((b as number) | 0);
}

function binop_int_or(a: sink_val, b: sink_val): sink_val {
	return ((a as number) | 0) | ((b as number) | 0);
}

function binop_int_xor(a: sink_val, b: sink_val): sink_val {
	return ((a as number) | 0) ^ ((b as number) | 0);
}

function binop_int_shl(a: sink_val, b: sink_val): sink_val {
	return ((a as number) | 0) << ((b as number) | 0);
}

function binop_int_shr(a: sink_val, b: sink_val): sink_val {
	return ((a as number) | 0) >>> ((b as number) | 0);
}

function binop_int_sar(a: sink_val, b: sink_val): sink_val {
	return ((a as number) | 0) >> ((b as number) | 0);
}

function binop_int_add(a: sink_val, b: sink_val): sink_val {
	return ((a as number) | 0) + ((b as number) | 0);
}

function binop_int_sub(a: sink_val, b: sink_val): sink_val {
	return ((a as number) | 0) - ((b as number) | 0);
}

function binop_int_mul(a: sink_val, b: sink_val): sink_val {
	return ((a as number) | 0) * ((b as number) | 0);
}

function binop_int_div(a: sink_val, b: sink_val): sink_val {
	let i = (b as number) | 0;
	if (i == 0)
		return 0;
	return ((a as number) | 0) / i;
}

function binop_int_mod(a: sink_val, b: sink_val): sink_val {
	let i = (b as number) | 0;
	if (i == 0)
		return 0;
	return ((a as number) | 0) % i;
}

export function sink_size(ctx: sink_ctx, a: sink_val): number {
	if (sink_islist(a))
		return a.length;
	else if (sink_isstr(a))
		return a.length;
	opi_abort(ctx, "Expecting string or list for size");
	return 0;
}

export function sink_tonum(ctx: sink_ctx, a: sink_val): sink_val {
	if (!oper_typelist(a, LT_ALLOWNIL | LT_ALLOWNUM | LT_ALLOWSTR)){
		opi_abort(ctx, 'Expecting string when converting to number');
		return SINK_NIL;
	}
	return oper_un(a, unop_tonum);
}

export function sink_say(ctx: sink_ctx, vals: sink_val[]): undefined | Promise<undefined> {
	if (ctx.io.f_say){
		return ctx.io.f_say(
			ctx,
			sink_list_joinplain(vals, ' '),
			ctx.io.user
		);
	}
}

export function sink_warn(ctx: sink_ctx, vals: sink_val[]): undefined | Promise<undefined> {
	if (ctx.io.f_warn){
		return ctx.io.f_warn(
			ctx,
			sink_list_joinplain(vals, ' '),
			ctx.io.user
		);
	}
}

export function sink_ask(ctx: sink_ctx, vals: sink_val[]): sink_val {
	if (ctx.io.f_ask){
		return ctx.io.f_ask(
			ctx,
			sink_list_joinplain(vals, ' '),
			ctx.io.user
		);
	}
	return SINK_NIL;
}

function opi_exit(ctx: context_st): sink_run {
	ctx.passed = true;
	return sink_run.PASS;
}

function callstack_flp(ctx: context_st, pc: number): filepos_st {
	let flp = FILEPOS_NULL;
	let i = 0;
	for ( ; i < ctx.prg.posTable.length; i++){
		let p = ctx.prg.posTable[i];
		if (p.pc > pc){
			if (i > 0)
				flp = ctx.prg.posTable[i - 1].flp;
			break;
		}
	}
	if (i > 0 && i === ctx.prg.posTable.length)
		flp = ctx.prg.posTable[i - 1].flp;
	return flp;
}

function callstack_cmdhint(ctx: context_st, pc: number): number {
	for (let i = 0; i < ctx.prg.cmdTable.length; i++){
		let p = ctx.prg.cmdTable[i];
		if (p.pc > pc){
			// start working backwards
			let nest = 0;
			for (let j = i - 1; j >= 0; j--){
				p = ctx.prg.cmdTable[j];
				if (p.cmdhint < 0)
					nest++;
				else{
					nest--;
					if (nest < 0)
						return p.cmdhint;
				}
			}
			break;
		}
	}
	return -1;
}

function callstack_append(ctx: context_st, err: string | null, pc: number): string | null {
	let flp = callstack_flp(ctx, pc);
	let cmdhint = callstack_cmdhint(ctx, pc);
	let chn: string | null = null;
	if (cmdhint >= 0)
		chn = program_getdebugstr(ctx.prg, cmdhint);
	if (flp.line >= 0){
		let err2 = program_errormsg(ctx.prg, flp, null);
		if (chn){
			if (err)
				return err + '\n    at ' + chn + ' (' + err2 + ')';
			return chn + ' (' + err2 + ')';
		}
		else{
			if (err)
				return err + '\n    at ' + err2;
			return err2;
		}
	}
	else if (chn){
		if (err)
			return err + '\n    at ' + chn;
		return chn;
	}
	return err;
}

function opi_abort(ctx: sink_ctx, err: string | null): sink_run {
	ctx.failed = true;
	if (err === null)
		return sink_run.FAIL;
	err = callstack_append(ctx, err, ctx.lastpc);
	for (let i = ctx.call_stk.length - 1, j = 0; i >= 0 && j < 9; i--, j++){
		let here = ctx.call_stk[i];
		err = callstack_append(ctx, err, here.pc - 1);
	}
	ctx.err = 'Error: ' + err;
	return sink_run.FAIL;
}

export function sink_stacktrace(ctx: sink_ctx): sink_val {
	let ls = new sink_list();
	let err = callstack_append(ctx, null, ctx.lastpc);
	if (err)
		ls.push(err);
	for (let i = ctx.call_stk.length - 1; i >= 0; i--){
		let here = ctx.call_stk[i];
		err = callstack_append(ctx, null, here.pc - 1);
		if (err)
			ls.push(err);
	}
	return ls;
}

function opi_unop(ctx: sink_ctx, a: sink_val, f_unary: unary_f, erop: string): sink_val {
	if (!oper_typelist(a, LT_ALLOWNUM))
		return opi_abort(ctx, 'Expecting number or list of numbers when ' + erop);
	return oper_un(a, f_unary);
}

function opi_binop(ctx: sink_ctx, a: sink_val, b: sink_val, f_binary: binary_f, erop: string,
	t1: number, t2: number): sink_val {
	if (!oper_typelist(a, t1))
		return opi_abort(ctx, 'Expecting number or list of numbers when ' + erop);
	if (!oper_typelist(b, t2))
		return opi_abort(ctx, 'Expecting number or list of numbers when ' + erop);
	return oper_bin(a, b, f_binary);
}

function opi_triop(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val, f_trinary: trinary_f,
	erop: string): sink_val {
	if (!oper_typelist(a, LT_ALLOWNUM))
		return opi_abort(ctx, 'Expecting number or list of numbers when ' + erop);
	if (!oper_typelist(b, LT_ALLOWNUM))
		return opi_abort(ctx, 'Expecting number or list of numbers when ' + erop);
	if (!oper_typelist(c, LT_ALLOWNUM))
		return opi_abort(ctx, 'Expecting number or list of numbers when ' + erop);
	return oper_tri(a, b, c, f_trinary);
}

function opi_combop(ctx: sink_ctx, vals: sink_val[], f_binary: binary_f, erop: string): sink_val {
	if (vals.length <= 0)
		return opi_abort(ctx, 'Expecting number or list of numbers when ' + erop);
	let listsize = -1;
	for (let i = 0; i < vals.length; i++){
		let ls = vals[i];
		if (sink_islist(ls)){
			if (ls.length > listsize)
				listsize = ls.length;
			for (let j = 0; j < vals.length; j++){
				if (!sink_isnum(ls[j]))
					return opi_abort(ctx, 'Expecting number or list of numbers when ' + erop);
			}
		}
		else if (!sink_isnum(ls))
			return opi_abort(ctx, 'Expecting number or list of numbers when ' + erop);
	}

	if (listsize < 0){
		// no lists, so just combine
		for (let i = 1; i < vals.length; i++)
			vals[0] = f_binary(vals[0], vals[i]);
		return vals[0];
	}
	else if (listsize > 0){
		let ret = new sink_list();
		for (let j = 0; j < listsize; j++)
			ret.push(arget(vals[0], j));
		for (let i = 1; i < vals.length; i++){
			for (let j = 0; j < listsize; j++)
				ret[j] = f_binary(ret[j], arget(vals[i], j));
		}
		return ret;
	}
	// otherwise, listsize === 0
	return new sink_list();
}

export function sink_str_cat(ctx: sink_ctx, vals: sink_val[]): sink_val {
	return sink_list_joinplain(vals, '');
}

interface fix_slice_st {
	start: number;
	len: number;
}

function fix_slice(startv: number, lenv: number | null, objsize: number): fix_slice_st {
	let start = Math.round(startv);
	if (lenv === null){
		if (start < 0)
			start += objsize;
		if (start < 0)
			start = 0;
		if (start >= objsize)
			return { start: 0, len: 0 };
		return { start: start, len: objsize - start };
	}
	else{
		let len = Math.round(lenv);
		let wasneg = start < 0;
		if (len < 0){
			wasneg = start <= 0;
			start += len;
			len = -len;
		}
		if (wasneg)
			start += objsize;
		if (start < 0){
			len += start;
			start = 0;
		}
		if (len <= 0)
			return { start: 0, len: 0 };
		if (start + len > objsize)
			len = objsize - start;
		return { start: start, len: len };
	}
}

export function sink_str_slice(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val): sink_val {
	if (!sink_isstr(a)){
		opi_abort(ctx, 'Expecting list or string when slicing');
		return SINK_NIL;
	}
	if (!sink_isnum(b) || (!sink_isnil(c) && !sink_isnum(c))){
		opi_abort(ctx, 'Expecting slice values to be numbers');
		return SINK_NIL;
	}
	if (a.length <= 0)
		return a;
	let sl = fix_slice(b, c, a.length);
	if (sl.len <= 0)
		return '';
	return a.substr(sl.start, sl.len);
}

export function sink_str_splice(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val,
	d: sink_val): sink_val {
	if (!sink_isstr(a)){
		opi_abort(ctx, 'Expecting list or string when splicing');
		return SINK_NIL;
	}
	if (!sink_isnum(b) || (!sink_isnil(c) && !sink_isnum(c))){
		opi_abort(ctx, 'Expecting splice values to be numbers');
		return SINK_NIL;
	}
	if (!sink_isnil(d) && !sink_isstr(d)){
		opi_abort(ctx, 'Expecting spliced value to be a string');
		return SINK_NIL;
	}
	let sl = fix_slice(b, c, a.length);
	if (sink_isnil(d)){
		if (sl.len <= 0)
			return a;
		let tot = a.length - sl.len;
		if (tot <= 0)
			return '';
		return a.substr(0, sl.start) + a.substr(sl.start + sl.len);
	}
	else{
		let tot = a.length - sl.len + d.length;
		if (tot <= 0)
			return '';
		return a.substr(0, sl.start) + d + a.substr(sl.start + sl.len);
	}
}

export function sink_list_new(ctx: sink_ctx, a: sink_val, b: sink_val): sink_val {
	if (!sink_isnil(a) && !sink_isnum(a)){
		opi_abort(ctx, 'Expecting number for list.new');
		return SINK_NIL;
	}
	let size = sink_isnil(a) ? 0 : a;
	let ret = new sink_list();
	for (let i = 0; i < size; i++)
		ret.push(b);
	return ret;
}

function opi_list_cat(ctx: sink_ctx, vals: sink_val[]): sink_val {
	let res = new sink_list();
	for (let i = 0; i < vals.length; i++)
		res.push.apply(res, vals[i]);
	return res;
}

export function sink_list_slice(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list or string when slicing');
		return SINK_NIL;
	}
	if (!sink_isnum(b) || (!sink_isnil(c) && !sink_isnum(c))){
		opi_abort(ctx, 'Expecting slice values to be numbers');
		return SINK_NIL;
	}
	let sl = fix_slice(b, c, a.length);
	let res = new sink_list();
	if (a.length <= 0 || sl.len <= 0)
		return new sink_list();
	for (let i = 0; i < sl.len; i++)
		res.push(a[sl.start + i]);
	return res;
}

export function sink_list_splice(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val,
	d: sink_val): void {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list or string when splicing');
		return;
	}
	if (!sink_isnum(b) || (!sink_isnil(c) && !sink_isnum(c))){
		opi_abort(ctx, 'Expecting splice values to be numbers');
		return;
	}
	if (!sink_isnil(d) && !sink_islist(d)){
		opi_abort(ctx, 'Expecting spliced value to be a list');
		return;
	}
	let sl = fix_slice(b, c, a.length);
	if (sink_isnil(d)){
		if (sl.len <= 0)
			return;
		a.splice(sl.start, sl.len);
	}
	else{
		let t = d.concat();
		d.unshift(sl.len);
		d.unshift(sl.start);
		a.splice.apply(a, d);
	}
}

export function sink_list_shift(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list when shifting');
		return SINK_NIL;
	}
	if (a.length <= 0)
		return SINK_NIL;
	return a.shift() as sink_val;
}

export function sink_list_pop(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list when popping');
		return SINK_NIL;
	}
	if (a.length <= 0)
		return SINK_NIL;
	return a.pop() as sink_val;
}

export function sink_list_push(ctx: sink_ctx, a: sink_val, b: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list when pushing');
		return SINK_NIL;
	}
	a.push(b);
	return a;
}

export function sink_list_unshift(ctx: sink_ctx, a: sink_val, b: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list when unshifting');
		return SINK_NIL;
	}
	a.unshift(b);
	return a;
}

export function sink_list_append(ctx: sink_ctx, a: sink_val, b: sink_val): sink_val {
	if (!sink_islist(a) || !sink_islist(b)){
		opi_abort(ctx, 'Expecting list when appending');
		return SINK_NIL;
	}
	if (b.length > 0)
		a.push.apply(a, b);
	return a;
}

export function sink_list_prepend(ctx: sink_ctx, a: sink_val, b: sink_val): sink_val {
	if (!sink_islist(a) || !sink_islist(b)){
		opi_abort(ctx, 'Expecting list when prepending');
		return SINK_NIL;
	}
	if (b.length > 0)
		a.unshift.apply(a, b);
	return a;
}

export function sink_list_find(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list for list.find');
		return SINK_NIL;
	}
	if (!sink_isnil(c) && !sink_isnum(c)){
		opi_abort(ctx, 'Expecting number for list.find');
		return SINK_NIL;
	}
	let pos = (sink_isnil(c) || isNaN(c)) ? 0 : c;
	if (pos < 0)
		pos = 0;
	let res = a.indexOf(b, pos);
	if (res >= 0)
		return res;
	return SINK_NIL;
}

export function sink_list_rfind(ctx: sink_ctx, a: sink_val, b: sink_val, c: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list for list.rfind');
		return SINK_NIL;
	}
	if (!sink_isnil(c) && !sink_isnum(c)){
		opi_abort(ctx, 'Expecting number for list.rfind');
		return SINK_NIL;
	}
	let pos = (sink_isnil(c) || isNaN(c)) ? a.length - 1 : c;
	if (pos < 0 || pos >= a.length)
		pos = a.length - 1;
	let res = a.lastIndexOf(b, pos);
	if (res >= 0)
		return res;
	return SINK_NIL;
}

export function sink_list_join(ctx: sink_ctx, a: sink_val, b: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list for list.join');
		return SINK_NIL;
	}
	return sink_list_joinplain(a, sink_isnil(b) ? '' : sink_tostr(b));
}

export function sink_list_rev(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list for list.rev');
		return SINK_NIL;
	}
	a.reverse();
	return a;
}

export function sink_list_str(ctx: sink_ctx, a: sink_val): sink_val {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list for list.str');
		return SINK_NIL;
	}
	let res = '';
	for (let i = 0; i < a.length; i++){
		let b = a[i];
		if (!sink_isnum(b)){
			opi_abort(ctx, 'Expecting list of integers for list.str');
			return SINK_NIL;
		}
		if (b < 0)
			b = 0;
		else if (b > 255)
			b = 255;
		res += String.fromCharCode(b);
	}
	return res;
}

function sortboth(ctx: sink_ctx, li: sink_val[], a: sink_val, b: sink_val): number {
	let atype = sink_typeof(a);
	let btype = sink_typeof(b);

	if (a === b)
		return 0;

	if (atype !== btype){
		if (atype === sink_type.NIL)
			return -1;
		else if (atype === sink_type.NUM)
			return btype === sink_type.NIL ? 1 : -1;
		else if (atype === sink_type.STR)
			return btype === sink_type.LIST ? -1 : 1;
		return 1;
	}

	if (atype === sink_type.NUM){
		if (isNaN(a as number)){
			if (isNaN(b as number))
				return 0;
			return -1;
		}
		else if (isNaN(b as number))
			return 1;
		return (a as number) < (b as number) ? -1 : 1;
	}
	else if (atype === sink_type.STR)
		return (a as string) < (b as string) ? -1 : 1;
	// otherwise, comparing two lists
	if (li.indexOf(a) >= 0 || li.indexOf(b) >= 0){
		opi_abort(ctx, 'Cannot sort circular lists');
		return -1;
	}
	let ls1 = a as sink_list;
	let ls2 = b as sink_list;
	if (ls1.length === 0){
		if (ls2.length === 0)
			return 0;
		return -1;
	}
	else if (ls2.length === 0)
		return 1;
	let minsize = Math.min(ls1.length, ls2.length);
	li.push(a, b);
	for (let i = 0; i < minsize; i++){
		let res = sortboth(ctx, li, ls1[i], ls2[i]);
		if (res < 0){
			li.pop();
			li.pop();
			return -1;
		}
		else if (res > 0){
			li.pop();
			li.pop();
			return 1;
		}
	}
	li.pop();
	li.pop();
	if (ls1.length < ls2.length)
		return -1;
	else if (ls1.length > ls2.length)
		return 1;
	return 0;
}

export function sink_list_sort(ctx: sink_ctx, a: sink_val): void {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list for list.sort');
		return;
	}
	let li: sink_val[] = [];
	a.sort(function(a: sink_val, b: sink_val): number {
		return sortboth(ctx, li, a, b);
	});
}

export function sink_list_rsort(ctx: sink_ctx, a: sink_val): void {
	if (!sink_islist(a)){
		opi_abort(ctx, 'Expecting list for list.rsort');
		return;
	}
	let li: sink_val[] = [];
	a.sort(function(a: sink_val, b: sink_val): number {
		return -sortboth(ctx, li, a, b);
	});
}

export function sink_order(ctx: sink_ctx, a: sink_val, b: sink_val): number {
	return sortboth(ctx, [], a, b);
}

export function sink_range(ctx: sink_ctx, start: number, stop: number, step: number): sink_val {
	let count = Math.ceil((stop - start) / step);
	if (count > 10000000){
		opi_abort(ctx, 'Range too large (maximum 10000000)');
		return SINK_NIL;
	}
	let ret = new sink_list();
	for (let i = 0; i < count; i++)
		ret.push(start + i * step);
	return ret;
}

function numtostr(num: number): string {
	return '' + num;
}
/*
static inline bool pk_isjson(sink_str s){
	enum {
		PKV_START,
		PKV_NULL1,
		PKV_NULL2,
		PKV_NULL3,
		PKV_NUM_0,
		PKV_NUM_NEG,
		PKV_NUM_INT,
		PKV_NUM_FRAC,
		PKV_NUM_FRACE,
		PKV_NUM_FRACE2,
		PKV_NUM_EXP,
		PKV_STR,
		PKV_STR_ESC,
		PKV_STR_U1,
		PKV_STR_U2,
		PKV_STR_U3,
		PKV_STR_U4,
		PKV_ARRAY,
		PKV_ENDVAL
	} state = PKV_START;
	int arrays = 0;
	for (int i = 0; i < s.size; i++){
		uint8_t b = s.bytes[i];
		uint8_t nb = i < s.size - 1 ? s.bytes[i + 1] : 0;
		switch (state){
			case PKV_START: // start state
				if (b === 'n'){
					if (nb !== 'u')
						return 0;
					state = PKV_NULL1;
				}
				else if (b === '0'){
					if (nb === '.' || nb === 'e' || nb === 'E')
						state = PKV_NUM_0;
					else
						state = PKV_ENDVAL;
				}
				else if (b === '-')
					state = PKV_NUM_NEG;
				else if (isNum((char)b)){
					if (isNum((char)nb))
						state = PKV_NUM_INT;
					else if (nb === '.' || nb === 'e' || nb === 'E')
						state = PKV_NUM_0;
					else
						state = PKV_ENDVAL;
				}
				else if (b === '"')
					state = PKV_STR;
				else if (b === '['){
					arrays++;
					if (isSpace((char)nb) || nb === ']')
						state = PKV_ARRAY;
				}
				else if (!isSpace((char)b))
					return 0;
				break;
			case PKV_NULL1:
				if (nb !== 'l')
					return 0;
				state = PKV_NULL2;
				break;
			case PKV_NULL2:
				if (nb !== 'l')
					return 0;
				state = PKV_NULL3;
				break;
			case PKV_NULL3:
				state = PKV_ENDVAL;
				break;
			case PKV_NUM_0:
				if (b === '.')
					state = PKV_NUM_FRAC;
				else if (b === 'e' || b === 'E'){
					if (nb === '+' || nb === '-')
						i++;
					state = PKV_NUM_EXP;
				}
				else
					return 0;
				break;
			case PKV_NUM_NEG:
				if (b === '0'){
					if (nb === '.' || nb === 'e' || nb === 'E')
						state = PKV_NUM_0;
					else
						state = PKV_ENDVAL;
				}
				else if (isNum((char)b)){
					if (isNum((char)nb))
						state = PKV_NUM_INT;
					else if (nb === '.' || nb === 'e' || nb === 'E')
						state = PKV_NUM_0;
					else
						state = PKV_ENDVAL;
				}
				else
					return 0;
				break;
			case PKV_NUM_INT:
				if (!isNum((char)b))
					return 0;
				if (nb === '.' || nb === 'e' || nb === 'E')
					state = PKV_NUM_0;
				else if (!isNum((char)nb))
					state = PKV_ENDVAL;
				break;
			case PKV_NUM_FRAC:
				if (!isNum((char)b))
					return 0;
				if (nb === 'e' || nb === 'E')
					state = PKV_NUM_FRACE;
				else if (!isNum((char)nb))
					state = PKV_ENDVAL;
				break;
			case PKV_NUM_FRACE:
				state = PKV_NUM_FRACE2;
				break;
			case PKV_NUM_FRACE2:
				if (isNum((char)b)){
					if (isNum((char)nb))
						state = PKV_NUM_EXP;
					else
						state = PKV_ENDVAL;
				}
				else if (b === '+' || b === '-')
					state = PKV_NUM_EXP;
				else
					return 0;
				break;
			case PKV_NUM_EXP:
				if (!isNum((char)b))
					return 0;
				if (!isNum((char)nb))
					state = PKV_ENDVAL;
				break;
			case PKV_STR:
				if (b === '\\')
					state = PKV_STR_ESC;
				else if (b === '"')
					state = PKV_ENDVAL;
				else if (b < 0x20)
					return 0;
				break;
			case PKV_STR_ESC:
				if (b === '"' || b === '\\' || b === '/' || b === 'b' ||
					b === 'f' || b === 'n' || b === 'r' || b === 't')
					state = PKV_STR;
				else if (b === 'u'){
					if (nb !== '0')
						return 0;
					state = PKV_STR_U1;
				}
				else
					return 0;
				break;
			case PKV_STR_U1:
				if (nb !== '0')
					return 0;
				state = PKV_STR_U2;
				break;
			case PKV_STR_U2:
				if (!isHex((char)nb))
					return 0;
				state = PKV_STR_U3;
				break;
			case PKV_STR_U3:
				if (!isHex((char)nb))
					return 0;
				state = PKV_STR_U4;
				break;
			case PKV_STR_U4:
				state = PKV_STR;
				break;
			case PKV_ARRAY:
				if (b === ']')
					state = PKV_ENDVAL;
				else if (!isSpace((char)nb) && nb !== ']')
					state = PKV_START;
				break;
			case PKV_ENDVAL:
				if (arrays > 0){
					if (b === ',')
						state = PKV_START;
					else if (b === ']')
						arrays--;
					else if (!isSpace((char)b))
						return 0;
				}
				else if (!isSpace((char)b))
					return 0;
				break;
		}
	}
	return state === PKV_ENDVAL;
}

static bool pk_tojson(context ctx, sink_val a, list_int li, sink_str s){
	switch (sink_typeof(a)){
		case sink_type.NIL:
			set_null:
			s.size = 4;
			s.bytes = mem_alloc(sizeof(uint8_t) * 5);
			s.bytes[0] = 'n';
			s.bytes[1] = 'u';
			s.bytes[2] = 'l';
			s.bytes[3] = 'l';
			s.bytes[4] = 0;
			return true;
		case sink_type.NUM: {
			char buf[64];
			int sz;
			numtostr(a.f, buf, sizeof(buf), &sz);
			sink_str_st s2 = { .size = sz, .bytes = (uint8_t *)buf };
			if (pk_isjson(&s2)){
				s.size = sz;
				s.bytes = mem_alloc(sizeof(uint8_t) * (sz + 1));
				memcpy(s.bytes, buf, sizeof(uint8_t) * (sz + 1));
				return true;
			}
			// if C's rendering of the number is not valid JSON, then we have a goofy number, so
			// just set it to null
			goto set_null;
		} break;
		case sink_type.STR: {
			int tot = 2;
			sink_str src = var_caststr(ctx, a);
			// calculate total size first
			for (int i = 0; i < src.size; i++){
				uint8_t b = src.bytes[i];
				if (b === '"' || b === '\\' || b === '\b' || b === '\f' || b === '\n' || b === '\r' ||
					b === '\t')
					tot += 2;
				else if (b < 0x20 || b >= 0x80) // \u00XX
					tot += 6;
				else
					tot++;
			}
			s.size = tot;
			s.bytes = mem_alloc(sizeof(uint8_t) * (tot + 1));
			// render string
			int pos = 0;
			s.bytes[pos++] = '"';
			for (int i = 0; i < src.size; i++){
				uint8_t b = src.bytes[i];
				if (b === '"' || b === '\\'){
					s.bytes[pos++] = '\\';
					s.bytes[pos++] = b;
				}
				else if (b === '\b'){
					s.bytes[pos++] = '\\';
					s.bytes[pos++] = 'b';
				}
				else if (b === '\f'){
					s.bytes[pos++] = '\\';
					s.bytes[pos++] = 'f';
				}
				else if (b === '\n'){
					s.bytes[pos++] = '\\';
					s.bytes[pos++] = 'n';
				}
				else if (b === '\r'){
					s.bytes[pos++] = '\\';
					s.bytes[pos++] = 'r';
				}
				else if (b === '\t'){
					s.bytes[pos++] = '\\';
					s.bytes[pos++] = 't';
				}
				else if (b < 0x20 || b >= 0x80){ // \u00XX
					s.bytes[pos++] = '\\';
					s.bytes[pos++] = 'u';
					s.bytes[pos++] = '0';
					s.bytes[pos++] = '0';
					s.bytes[pos++] = toNibble((b >> 4) & 0x0F);
					s.bytes[pos++] = toNibble(b & 0x0F);
				}
				else
					s.bytes[pos++] = b;
			}
			s.bytes[pos++] = '"';
			s.bytes[pos] = 0;
			return true;
		} break;
		case sink_type.LIST: {
			int idx = var_index(a);
			if (list_int_has(li, idx))
				return false; // circular
			list_int_push(li, idx);
			sink_list ls = var_castlist(ctx, a);
			int tot = 2;
			sink_str_st *strs = mem_alloc(sizeof(sink_str_st) * ls.size);
			for (int i = 0; i < ls.size; i++){
				sink_str_st s2;
				if (!pk_tojson(ctx, ls.vals[i], li, &s2)){
					for (int j = 0; j < i; j++)
						mem_free(strs[j].bytes);
					mem_free(strs);
					return false;
				}
				strs[i] = s2;
				tot += (i === 0 ? 0 : 1) + s2.size;
			}
			list_int_pop(li);
			uint8_t *bytes = mem_alloc(sizeof(uint8_t) * (tot + 1));
			bytes[0] = '[';
			int p = 1;
			for (int i = 0; i < ls.size; i++){
				if (i > 0)
					bytes[p++] = ',';
				memcpy(&bytes[p], strs[i].bytes, sizeof(uint8_t) * strs[i].size);
				mem_free(strs[i].bytes);
				p += strs[i].size;
			}
			mem_free(strs);
			bytes[p] = ']';
			bytes[tot] = 0;
			s.size = tot;
			s.bytes = bytes;
			return true;
		} break;
		case sink_type.ASYNC:
			opi_abort(ctx, "Cannot pickle invalid value (SINK_ASYNC)");
			return false;
	}
}

static inline sink_val sink_pickle_json(context ctx, sink_val a){
	list_int li = NULL;
	if (sink_islist(a))
		li = list_int_new();
	sink_str_st s = { .size = 0, .bytes = NULL};
	bool suc = pk_tojson(ctx, a, li, &s);
	if (li)
		list_int_free(li);
	if (!suc){
		if (s.bytes)
			mem_free(s.bytes);
		if (!ctx.failed)
			opi_abort(ctx, "Cannot pickle circular structure to JSON format");
		return SINK_NIL;
	}
	return sink_str_newblobgive(ctx, s.size, s.bytes);
}

static inline void pk_tobin_vint(list_byte body, uint32_t i){
	if (i < 128)
		list_byte_push(body, i);
	else{
		list_byte_push4(body,
			0x80 | (i >> 24),
			(i >> 16) & 0xFF,
			(i >>  8) & 0xFF,
			 i        & 0xFF);
	}
}

static void pk_tobin(context ctx, sink_val a, list_int li, uint32_t *str_table_size, list_byte strs,
	list_byte body){
	switch (sink_typeof(a)){
		case sink_type.NIL:
			list_byte_push(body, 0xF7);
			break;
		case sink_type.NUM: {
			if (floor(a.f) === a.f && a.f >= -4294967296.0 && a.f < 4294967296.0){
				int64_t num = a.f;
				if (num < 0){
					if (num >= -256){
						num += 256;
						list_byte_push2(body, 0xF1, num & 0xFF);
					}
					else if (num >= -65536){
						num += 65536;
						list_byte_push3(body, 0xF3, num & 0xFF, num >> 8);
					}
					else{
						num += 4294967296;
						list_byte_push5(body, 0xF5, num & 0xFF, (num >> 8) & 0xFF,
							(num >> 16) & 0xFF, (num >> 24) & 0xFF);
					}
				}
				else{
					if (num < 256)
						list_byte_push2(body, 0xF0, num & 0xFF);
					else if (num < 65536)
						list_byte_push3(body, 0xF2, num & 0xFF, num >> 8);
					else{
						list_byte_push5(body, 0xF4, num & 0xFF, (num >> 8) & 0xFF,
							(num >> 16) & 0xFF, (num >> 24) & 0xFF);
					}
				}
			}
			else{
				list_byte_push9(body, 0xF6,
					a.u & 0xFF, (a.u >> 8) & 0xFF, (a.u >> 16) & 0xFF, (a.u >> 24) & 0xFF,
					(a.u >> 32) & 0xFF, (a.u >> 40) & 0xFF, (a.u >> 48) & 0xFF, (a.u >> 56) & 0xFF);
			}
		} break;
		case sink_type.STR: {
			// search for a previous string
			sink_str s = var_caststr(ctx, a);
			int spos = 0;
			uint32_t sidx = 0;
			bool found = false;
			while (!found && sidx < *str_table_size){
				uint32_t vi = strs.bytes[spos++];
				if (vi >= 128){
					vi = ((vi ^ 0x80) << 24) |
						((uint32_t)strs.bytes[spos    ] << 16) |
						((uint32_t)strs.bytes[spos + 1] <<  8) |
						((uint32_t)strs.bytes[spos + 2]      );
					spos += 3;
				}
				if (vi === s.size){
					found = vi === 0 ||
						memcmp(&strs.bytes[spos], s.bytes, sizeof(uint8_t) * vi) === 0;
				}
				if (!found){
					spos += vi;
					sidx++;
				}
			}
			if (!found){
				pk_tobin_vint(strs, s.size);
				list_byte_append(strs, s.size, s.bytes);
				sidx = *str_table_size;
				(*str_table_size)++;
			}
			list_byte_push(body, 0xF8);
			pk_tobin_vint(body, sidx);
		} break;
		case sink_type.LIST: {
			int idx = var_index(a);
			int idxat = list_int_at(li, idx);
			if (idxat < 0){
				list_int_push(li, idx);
				sink_list ls = var_castlist(ctx, a);
				list_byte_push(body, 0xF9);
				pk_tobin_vint(body, ls.size);
				for (int i = 0; i < ls.size; i++)
					pk_tobin(ctx, ls.vals[i], li, str_table_size, strs, body);
			}
			else{
				list_byte_push(body, 0xFA);
				pk_tobin_vint(body, idxat);
			}
		} break;
		case sink_type.ASYNC:
			opi_abort(ctx, "Cannot pickle invalid value (SINK_ASYNC)");
			break;
	}
}

static inline bool opi_pickle_binstr(context ctx, sink_val a, sink_str_st *out){
	list_int li = NULL;
	if (sink_islist(a))
		li = list_int_new();
	uint32_t str_table_size = 0;
	list_byte strs = list_byte_new();
	list_byte body = list_byte_new();
	pk_tobin(ctx, a, li, &str_table_size, strs, body);
	if (li)
		list_int_free(li);
	if (ctx.failed){
		list_byte_free(strs);
		list_byte_free(body);
		return false;
	}
	int tot = 1 + (str_table_size < 128 ? 1 : 4) + strs.size + body.size;
	uint8_t *bytes = mem_alloc(sizeof(uint8_t) * (tot + 1));
	int pos = 0;
	bytes[pos++] = 0x01;
	if (str_table_size < 128)
		bytes[pos++] = str_table_size;
	else{
		bytes[pos++] = 0x80 | (str_table_size >> 24);
		bytes[pos++] = (str_table_size >> 16) & 0xFF;
		bytes[pos++] = (str_table_size >>  8) & 0xFF;
		bytes[pos++] =  str_table_size        & 0xFF;
	}
	if (strs.size > 0){
		memcpy(&bytes[pos], strs.bytes, sizeof(uint8_t) * strs.size);
		pos += strs.size;
	}
	memcpy(&bytes[pos], body.bytes, sizeof(uint8_t) * body.size);
	bytes[tot] = 0;
	list_byte_free(strs);
	list_byte_free(body);
	*out = (sink_str_st){ .size = tot, .bytes = bytes };
	return true;
}

static inline sink_val sink_pickle_bin(context ctx, sink_val a){
	sink_str_st str;
	if (!opi_pickle_binstr(ctx, a, &str))
		return SINK_NIL;
	return sink_str_newblobgive(ctx, str.size, str.bytes);
}

static inline bool pk_fmbin_vint(sink_str s, uint64_t *pos, uint32_t *res){
	if (s.size <= *pos)
		return false;
	uint32_t v = s.bytes[*pos];
	(*pos)++;
	if (v < 128){
		*res = v;
		return true;
	}
	if (s.size <= *pos + 2)
		return false;
	*res = ((v ^ 0x80) << 24) |
		((uint32_t)s.bytes[*pos    ] << 16) |
		((uint32_t)s.bytes[*pos + 1] <<  8) |
		((uint32_t)s.bytes[*pos + 2]      );
	(*pos) += 3;
	return true;
}

static bool pk_fmbin(context ctx, sink_str s, uint64_t *pos, uint32_t str_table_size,
	sink_val *strs, list_int li, sink_val *res){
	if (*pos >= s.size)
		return false;
	uint8_t cmd = s.bytes[*pos];
	(*pos)++;
	switch (cmd){
		case 0xF0: {
			if (*pos >= s.size)
				return false;
			*res = sink_num(s.bytes[*pos]);
			(*pos)++;
			return true;
		} break;
		case 0xF1: {
			if (*pos >= s.size)
				return false;
			*res = sink_num((int)s.bytes[*pos] - 256);
			(*pos)++;
			return true;
		} break;
		case 0xF2: {
			if (*pos + 1 >= s.size)
				return false;
			*res = sink_num(
				(int)s.bytes[*pos] |
				((int)s.bytes[*pos + 1] << 8));
			(*pos) += 2;
			return true;
		} break;
		case 0xF3: {
			if (*pos + 1 >= s.size)
				return false;
			*res = sink_num(
				((int)s.bytes[*pos] |
				((int)s.bytes[*pos + 1] << 8)) - 65536);
			(*pos) += 2;
			return true;
		} break;
		case 0xF4: {
			if (*pos + 3 >= s.size)
				return false;
			*res = sink_num(
				(int)s.bytes[*pos] |
				((int)s.bytes[*pos + 1] <<  8) |
				((int)s.bytes[*pos + 2] << 16) |
				((int)s.bytes[*pos + 3] << 24));
			(*pos) += 4;
			return true;
		} break;
		case 0xF5: {
			if (*pos + 3 >= s.size)
				return false;
			*res = sink_num(
				((double)((uint32_t)s.bytes[*pos] |
				((uint32_t)s.bytes[*pos + 1] <<  8) |
				((uint32_t)s.bytes[*pos + 2] << 16) |
				((uint32_t)s.bytes[*pos + 3] << 24))) - 4294967296.0);
			(*pos) += 4;
			return true;
		} break;
		case 0xF6: {
			if (*pos + 7 >= s.size)
				return false;
			res.u = ((uint64_t)s.bytes[*pos]) |
				(((uint64_t)s.bytes[*pos + 1]) <<  8) |
				(((uint64_t)s.bytes[*pos + 2]) << 16) |
				(((uint64_t)s.bytes[*pos + 3]) << 24) |
				(((uint64_t)s.bytes[*pos + 4]) << 32) |
				(((uint64_t)s.bytes[*pos + 5]) << 40) |
				(((uint64_t)s.bytes[*pos + 6]) << 48) |
				(((uint64_t)s.bytes[*pos + 7]) << 56);
			if (isnan(res.f)) // make sure no screwy NaN's come in
				*res = sink_num_nan();
			(*pos) += 8;
			return true;
		} break;
		case 0xF7: {
			*res = SINK_NIL;
			return true;
		} break;
		case 0xF8: {
			uint32_t id;
			if (!pk_fmbin_vint(s, pos, &id) || id >= str_table_size)
				return false;
			*res = strs[id];
			return true;
		} break;
		case 0xF9: {
			uint32_t sz;
			if (!pk_fmbin_vint(s, pos, &sz))
				return false;
			if (sz <= 0){
				*res = sink_list_newempty(ctx);
				list_int_push(li, var_index(*res));
			}
			else{
				sink_val *vals = mem_alloc(sizeof(sink_val) * sz);
				memset(vals, 0, sizeof(sink_val) * sz);
				*res = sink_list_newblobgive(ctx, sz, sz, vals);
				list_int_push(li, var_index(*res));
				for (uint32_t i = 0; i < sz; i++){
					if (!pk_fmbin(ctx, s, pos, str_table_size, strs, li, &vals[i]))
						return false;
				}
			}
			return true;
		} break;
		case 0xFA: {
			uint32_t id;
			if (!pk_fmbin_vint(s, pos, &id) || id >= li.size)
				return false;
			*res = (sink_val){ .u = SINK_TAG_LIST | li.vals[id] };
			return true;
		} break;
	}
	return false;
}

static bool pk_fmjson(context ctx, sink_str s, int *pos, sink_val *res){
	while (*pos < s.size && isSpace((char)s.bytes[*pos]))
		(*pos)++;
	if (*pos >= s.size)
		return false;
	uint8_t b = s.bytes[*pos];
	(*pos)++;
	if (b === 'n'){
		if (*pos + 2 >= s.size)
			return false;
		if (s.bytes[*pos] !== 'u' ||
			s.bytes[*pos + 1] !== 'l' ||
			s.bytes[*pos + 2] !== 'l')
			return false;
		(*pos) += 3;
		*res = SINK_NIL;
		return true;
	}
	else if (isNum((char)b) || b === '-'){
		numpart_info npi;
		numpart_new(&npi);
		if (b === '-'){
			if (*pos >= s.size)
				return false;
			npi.sign = -1;
			b = s.bytes[*pos];
			(*pos)++;
			if (!isNum((char)b))
				return false;
		}
		if (b >= '1' && b <= '9'){
			npi.val = b - '0';
			while (*pos < s.size && isNum((char)s.bytes[*pos])){
				npi.val = 10 * npi.val + (s.bytes[*pos] - '0');
				(*pos)++;
			}
		}
		if (s.bytes[*pos] === '.'){
			(*pos)++;
			if (*pos >= s.size || !isNum((char)s.bytes[*pos]))
				return false;
			while (*pos < s.size && isNum((char)s.bytes[*pos])){
				npi.frac = npi.frac * 10 + s.bytes[*pos] - '0';
				npi.flen++;
				(*pos)++;
			}
		}
		if (s.bytes[*pos] === 'e' || s.bytes[*pos] === 'E'){
			(*pos)++;
			if (*pos >= s.size)
				return false;
			if (s.bytes[*pos] === '-' || s.bytes[*pos] === '+'){
				npi.esign = s.bytes[*pos] === '-' ? -1 : 1;
				(*pos)++;
				if (*pos >= s.size)
					return false;
			}
			if (!isNum((char)s.bytes[*pos]))
				return false;
			while (*pos < s.size && isNum((char)s.bytes[*pos])){
				npi.eval = npi.eval * 10 + s.bytes[*pos] - '0';
				(*pos)++;
			}
		}
		*res = sink_num(numpart_calc(npi));
		return true;
	}
	else if (b === '"'){
		list_byte str = list_byte_new();
		while (*pos < s.size){
			b = s.bytes[*pos];
			if (b === '"'){
				(*pos)++;
				list_byte_null(str);
				sink_str_st bstr = list_byte_freetostr(str);
				*res = sink_str_newblobgive(ctx, bstr.size, bstr.bytes);
				return true;
			}
			else if (b === '\\'){
				(*pos)++;
				if (*pos >= s.size){
					list_byte_free(str);
					return false;
				}
				b = s.bytes[*pos];
				if (b === '"' || b === '\\')
					list_byte_push(str, b);
				else if (b === 'b')
					list_byte_push(str, '\b');
				else if (b === 'f')
					list_byte_push(str, '\f');
				else if (b === 'n')
					list_byte_push(str, '\n');
				else if (b === 'r')
					list_byte_push(str, '\r');
				else if (b === 't')
					list_byte_push(str, '\t');
				else if (b === 'u'){
					if (*pos + 4 >= s.size ||
						s.bytes[*pos + 1] !== '0' || s.bytes[*pos + 2] !== '0' ||
						!isHex(s.bytes[*pos + 3]) || !isHex(s.bytes[*pos + 4])){
						list_byte_free(str);
						return false;
					}
					list_byte_push(str,
						(toHex(s.bytes[*pos + 3]) << 4) | toHex(s.bytes[*pos + 4]));
					(*pos) += 4;
				}
				else{
					list_byte_free(str);
					return false;
				}
			}
			else if (b < 0x20){
				list_byte_free(str);
				return false;
			}
			else
				list_byte_push(str, b);
			(*pos)++;
		}
		list_byte_free(str);
		return false;
	}
	else if (b === '['){
		while (*pos < s.size && isSpace((char)s.bytes[*pos]))
			(*pos)++;
		if (*pos >= s.size)
			return false;
		if (s.bytes[*pos] === ']'){
			(*pos)++;
			*res = sink_list_newempty(ctx);
			return true;
		}
		*res = sink_list_newempty(ctx);
		while (true){
			sink_val item;
			if (!pk_fmjson(ctx, s, pos, &item))
				return false;
			sink_list_push(ctx, *res, item);
			while (*pos < s.size && isSpace((char)s.bytes[*pos]))
				(*pos)++;
			if (*pos >= s.size)
				return false;
			if (s.bytes[*pos] === ']'){
				(*pos)++;
				return true;
			}
			else if (s.bytes[*pos] === ',')
				(*pos)++;
			else
				return false;
		}
	}
	return false;
}

static inline bool opi_pickle_valstr(context ctx, sink_str s, sink_val *res){
	if (s.size < 1 || s.bytes[0] !== 0x01)
		return false;
	uint64_t pos = 1;
	uint32_t str_table_size;
	if (!pk_fmbin_vint(s, &pos, &str_table_size))
		return false;
	sink_val *strs = NULL;
	if (str_table_size > 0)
		strs = mem_alloc(sizeof(sink_val) * str_table_size);
	for (uint32_t i = 0; i < str_table_size; i++){
		uint32_t str_size;
		if (!pk_fmbin_vint(s, &pos, &str_size) || pos + str_size > s.size){
			mem_free(strs);
			return false;
		}
		strs[i] = sink_str_newblob(ctx, str_size, &s.bytes[pos]);
		pos += str_size;
	}
	list_int li = list_int_new();
	if (!pk_fmbin(ctx, s, &pos, str_table_size, strs, li, res)){
		mem_free(strs);
		list_int_free(li);
		return false;
	}
	mem_free(strs);
	list_int_free(li);
	return true;
}

static inline sink_val sink_pickle_val(context ctx, sink_val a){
	if (!sink_isstr(a)){
		opi_abort(ctx, "Invalid pickle data");
		return SINK_NIL;
	}
	sink_str s = var_caststr(ctx, a);
	if (s.size < 1){
		opi_abort(ctx, "Invalid pickle data");
		return SINK_NIL;
	}
	if (s.bytes[0] === 0x01){ // binary decode
		sink_val res;
		if (!opi_pickle_valstr(ctx, s, &res)){
			opi_abort(ctx, "Invalid pickle data");
			return SINK_NIL;
		}
		return res;
	}
	// otherwise, json decode
	int pos = 0;
	sink_val res;
	if (!pk_fmjson(ctx, s, &pos, &res)){
		opi_abort(ctx, "Invalid pickle data");
		return SINK_NIL;
	}
	while (pos < s.size){
		if (!isSpace(s.bytes[pos])){
			opi_abort(ctx, "Invalid pickle data");
			return SINK_NIL;
		}
		pos++;
	}
	return res;
}

static inline bool pk_isbin_adv(sink_str s, uint64_t *pos, uint32_t amt){
	(*pos) += amt;
	return *pos <= s.size;
}

static bool pk_isbin(sink_str s, uint64_t *pos, uint32_t *index, uint32_t str_table_size){
	if (s.size <= *pos)
		return false;
	uint8_t cmd = s.bytes[*pos];
	(*pos)++;
	switch (cmd){
		case 0xF0: return pk_isbin_adv(s, pos, 1);
		case 0xF1: return pk_isbin_adv(s, pos, 1);
		case 0xF2: return pk_isbin_adv(s, pos, 2);
		case 0xF3: return pk_isbin_adv(s, pos, 2);
		case 0xF4: return pk_isbin_adv(s, pos, 4);
		case 0xF5: return pk_isbin_adv(s, pos, 4);
		case 0xF6: return pk_isbin_adv(s, pos, 8);
		case 0xF7: return true;
		case 0xF8: {
			uint32_t str_id;
			if (!pk_fmbin_vint(s, pos, &str_id))
				return false;
			if (str_id >= str_table_size)
				return false;
			return true;
		} break;
		case 0xF9: {
			(*index)++;
			uint32_t list_size;
			if (!pk_fmbin_vint(s, pos, &list_size))
				return false;
			for (uint32_t i = 0; i < list_size; i++){
				if (!pk_isbin(s, pos, index, str_table_size))
					return false;
			}
			return true;
		} break;
		case 0xFA: {
			uint32_t ref;
			if (!pk_fmbin_vint(s, pos, &ref))
				return false;
			if (ref >= *index)
				return false;
			return true;
		} break;
	}
	return false;
}

static inline int sink_pickle_valid(context ctx, sink_val a){
	if (!sink_isstr(a))
		return 0;
	sink_str s = var_caststr(ctx, a);
	if (s.bytes === NULL)
		return 0;
	if (s.bytes[0] === 0x01){ // binary validation
		uint64_t pos = 1;
		uint32_t str_table_size;
		if (!pk_fmbin_vint(s, &pos, &str_table_size))
			return 0;
		for (uint32_t i = 0; i < str_table_size; i++){
			uint32_t str_size;
			if (!pk_fmbin_vint(s, &pos, &str_size))
				return 0;
			pos += str_size; // skip over string's raw bytes
		}
		uint32_t index = 0;
		if (!pk_isbin(s, &pos, &index, str_table_size))
			return 0;
		if (pos !== s.size)
			return 0;
		return 2;
	}
	// otherwise, json validation
	return pk_isjson(s) ? 1 : 0;
}

static bool pk_sib(context ctx, sink_val a, list_int all, list_int parents){
	int idx = var_index(a);
	if (list_int_has(parents, idx))
		return false;
	if (list_int_has(all, idx))
		return true;
	list_int_push(all, idx);
	list_int_push(parents, idx);
	sink_list ls = var_castlist(ctx, a);
	for (int i = 0; i < ls.size; i++){
		sink_val b = ls.vals[i];
		if (!sink_islist(b))
			continue;
		if (pk_sib(ctx, b, all, parents))
			return true;
	}
	list_int_pop(parents);
	return false;
}

static inline bool sink_pickle_sibling(context ctx, sink_val a){
	if (!sink_islist(a))
		return false;
	list_int all = list_int_new();
	list_int parents = list_int_new();
	bool res = pk_sib(ctx, a, all, parents);
	list_int_free(all);
	list_int_free(parents);
	return res;
}

static bool pk_cir(context ctx, sink_val a, list_int li){
	int idx = var_index(a);
	if (list_int_has(li, idx))
		return true;
	list_int_push(li, idx);
	sink_list ls = var_castlist(ctx, a);
	for (int i = 0; i < ls.size; i++){
		sink_val b = ls.vals[i];
		if (!sink_islist(b))
			continue;
		if (pk_cir(ctx, b, li))
			return true;
	}
	list_int_pop(li);
	return false;
}

static inline bool sink_pickle_circular(context ctx, sink_val a){
	if (!sink_islist(a))
		return false;
	list_int ls = list_int_new();
	bool res = pk_cir(ctx, a, ls);
	list_int_free(ls);
	return res;
}

static sink_val pk_copy(context ctx, sink_val a, list_int li_src, list_int li_tgt){
	switch (sink_typeof(a)){
		case sink_type.NIL:
		case sink_type.NUM:
		case sink_type.STR:
			return a;
		case sink_type.LIST: {
			int idx = var_index(a);
			int idxat = list_int_at(li_src, idx);
			if (idxat < 0){
				sink_list ls = var_castlist(ctx, a);
				if (ls.size <= 0){
					sink_val b = sink_list_newempty(ctx);
					list_int_push(li_src, idx);
					list_int_push(li_tgt, var_index(b));
					return b;
				}
				else{
					sink_val *m = mem_alloc(sizeof(sink_val) * ls.size);
					memset(m, 0, sizeof(sink_val) * ls.size);
					sink_val b = sink_list_newblobgive(ctx, ls.size, ls.size, m);
					list_int_push(li_src, idx);
					list_int_push(li_tgt, var_index(b));
					for (int i = 0; i < ls.size; i++)
						m[i] = pk_copy(ctx, ls.vals[i], li_src, li_tgt);
					return b;
				}
			}
			// otherwise, use the last generated list
			return (sink_val){ .u = SINK_TAG_LIST | li_tgt.vals[idxat] };
		} break;
		case sink_type.ASYNC:
			opi_abort(ctx, "Cannot pickle invalid value (SINK_ASYNC)");
			return SINK_NIL;
	}
}

static inline sink_val sink_pickle_copy(context ctx, sink_val a){
	list_int li_src = NULL, li_tgt = NULL;
	if (sink_islist(a)){
		li_src = list_int_new();
		li_tgt = list_int_new();
	}
	a = pk_copy(ctx, a, li_src, li_tgt);
	if (li_src){
		list_int_free(li_src);
		list_int_free(li_tgt);
	}
	return a;
}

// op descriptions for error messages
static const char *txt_num_neg      = "negating";
static const char *txt_num_add      = "adding";
static const char *txt_num_sub      = "subtracting";
static const char *txt_num_mul      = "multiplying";
static const char *txt_num_div      = "dividing";
static const char *txt_num_mod      = "taking modular";
static const char *txt_num_pow      = "exponentiating";
static const char *txt_num_abs      = "taking absolute value";
static const char *txt_num_sign     = "taking sign";
static const char *txt_num_clamp    = "clamping";
static const char *txt_num_floor    = "taking floor";
static const char *txt_num_ceil     = "taking ceil";
static const char *txt_num_round    = "rounding";
static const char *txt_num_trunc    = "truncating";
static const char *txt_num_isnan    = "testing if NaN";
static const char *txt_num_isfinite = "testing if finite";
static const char *txt_num_sin      = "taking sin";
static const char *txt_num_cos      = "taking cos";
static const char *txt_num_tan      = "taking tan";
static const char *txt_num_asin     = "taking arc-sin";
static const char *txt_num_acos     = "taking arc-cos";
static const char *txt_num_atan     = "taking arc-tan";
static const char *txt_num_log      = "taking logarithm";
static const char *txt_num_lerp     = "lerping";
static const char *txt_num_hex      = "converting to hex";
static const char *txt_num_oct      = "converting to oct";
static const char *txt_num_bin      = "converting to bin";
static const char *txt_int_new      = "casting to int";
static const char *txt_int_not      = "NOTing";
static const char *txt_int_and      = "ANDing";
static const char *txt_int_or       = "ORing";
static const char *txt_int_xor      = "XORing";
static const char *txt_int_shl      = "shifting left";
static const char *txt_int_shr      = "shifting right";
static const char *txt_int_clz      = "counting leading zeros";
static const char *txt_int_pop      = "population count";
static const char *txt_int_bswap    = "byte swaping";

static sink_run context_run(context ctx){
	if (ctx.passed) return SINK_RUN_PASS;
	if (ctx.failed) return SINK_RUN_FAIL;
	if (ctx.async ) return SINK_RUN_ASYNC;

	if (ctx.timeout > 0 && ctx.timeout_left <= 0){
		ctx.timeout_left = ctx.timeout;
		return SINK_RUN_TIMEOUT;
	}

	int A, B, C, D, E, F, G, H, I, J;
	sink_val X, Y, Z, W;
	sink_list ls;
	sink_str str;
	sink_val p[256];

	list_byte ops = ctx.prg.ops;

	#define LOAD_ab()                                                                      \
		ctx.pc++;                                                                         \
		A = ops.bytes[ctx.pc++]; B = ops.bytes[ctx.pc++];

	#define LOAD_abc()                                                                     \
		LOAD_ab();                                                                         \
		C = ops.bytes[ctx.pc++];

	#define LOAD_abcd()                                                                    \
		LOAD_ab();                                                                         \
		C = ops.bytes[ctx.pc++]; D = ops.bytes[ctx.pc++];

	#define LOAD_abcde()                                                                   \
		LOAD_abcd();                                                                       \
		E = ops.bytes[ctx.pc++];                                                         \

	#define LOAD_abcdef()                                                                  \
		LOAD_abcd();                                                                       \
		E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];

	#define LOAD_abcdefg()                                                                 \
		LOAD_abcdef();                                                                     \
		G = ops.bytes[ctx.pc++];

	#define LOAD_abcdefgh()                                                                \
		LOAD_abcdef();                                                                     \
		G = ops.bytes[ctx.pc++]; H = ops.bytes[ctx.pc++];

	#define LOAD_abcdefghi()                                                               \
		LOAD_abcdefgh();                                                                   \
		I = ops.bytes[ctx.pc++];

	#define LOAD_abcdefghij()                                                              \
		LOAD_abcdefgh();                                                                   \
		I = ops.bytes[ctx.pc++]; J = ops.bytes[ctx.pc++];

	#define INLINE_UNOP(func, erop)                                                        \
		LOAD_abcd();                                                                       \
		var_set(ctx, A, B, opi_unop(ctx, var_get(ctx, C, D), func, erop));                 \
		if (ctx.failed)                                                                   \
			return SINK_RUN_FAIL;

	#define INLINE_BINOP_T(func, erop, t1, t2)                                             \
		LOAD_abcdef();                                                                     \
		var_set(ctx, A, B,                                                                 \
			opi_binop(ctx, var_get(ctx, C, D), var_get(ctx, E, F), func, erop, t1, t2));   \
		if (ctx.failed)                                                                   \
			return SINK_RUN_FAIL;

	#define INLINE_BINOP(func, erop) INLINE_BINOP_T(func, erop, LT_ALLOWNUM, LT_ALLOWNUM)

	#define INLINE_TRIOP(func, erop)                                                       \
		LOAD_abcdefgh();                                                                   \
		var_set(ctx, A, B,                                                                 \
			opi_triop(ctx, var_get(ctx, C, D), var_get(ctx, E, F), var_get(ctx, G, H),     \
				func, erop));                                                              \
		if (ctx.failed)                                                                   \
			return SINK_RUN_FAIL;

	while (ctx.pc < ops.size){
		ctx.lastpc = ctx.pc;
		switch ((op_enum)ops.bytes[ctx.pc]){
			case op_enum.NOP            : { //
				ctx.pc++;
			} break;

			case op_enum.MOVE           : { // [TGT], [SRC]
				LOAD_abcd();
				var_set(ctx, A, B, var_get(ctx, C, D));
			} break;

			case op_enum.INC            : { // [TGT/SRC]
				LOAD_ab();
				X = var_get(ctx, A, B);
				if (!sink_isnum(X))
					return opi_abort(ctx, "Expecting number when incrementing");
				var_set(ctx, A, B, sink_num(X.f + 1));
			} break;

			case op_enum.NIL            : { // [TGT]
				LOAD_ab();
				var_set(ctx, A, B, SINK_NIL);
			} break;

			case op_enum.NUMP8          : { // [TGT], VALUE
				LOAD_abc();
				var_set(ctx, A, B, sink_num(C));
			} break;

			case op_enum.NUMN8          : { // [TGT], VALUE
				LOAD_abc();
				var_set(ctx, A, B, sink_num(C - 256));
			} break;

			case op_enum.NUMP16         : { // [TGT], [VALUE]
				LOAD_abcd();
				var_set(ctx, A, B, sink_num(C | (D << 8)));
			} break;

			case op_enum.NUMN16         : { // [TGT], [VALUE]
				LOAD_abcd();
				var_set(ctx, A, B, sink_num((C | (D << 8)) - 65536));
			} break;

			case op_enum.NUMP32         : { // [TGT], [[VALUE]]
				LOAD_abcdef();
				var_set(ctx, A, B, sink_num(
					((uint32_t)C) | (((uint32_t)D) << 8) |
					(((uint32_t)E) << 16) | (((uint32_t)F) << 24)
				));
			} break;

			case op_enum.NUMN32         : { // [TGT], [[VALUE]]
				LOAD_abcdef();
				var_set(ctx, A, B, sink_num(
					(double)(((uint32_t)C) | (((uint32_t)D) << 8) |
					(((uint32_t)E) << 16) | (((uint32_t)F) << 24)) - 4294967296.0
				));
			} break;

			case op_enum.NUMDBL         : { // [TGT], [[[VALUE]]]
				LOAD_abcdefghij();
				X.u = ((uint64_t)C) |
					(((uint64_t)D) << 8) |
					(((uint64_t)E) << 16) |
					(((uint64_t)F) << 24) |
					(((uint64_t)G) << 32) |
					(((uint64_t)H) << 40) |
					(((uint64_t)I) << 48) |
					(((uint64_t)J) << 56);
				if (isnan(X.f)) // make sure no screwy NaN's come in
					X = sink_num_nan();
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR            : { // [TGT], [[INDEX]]
				LOAD_abcdef();
				C = C + (D << 8) + (E << 16) + ((F << 23) * 2);
				if (ctx.prg.repl){
					list_byte s = ctx.prg.strTable.ptrs[C];
					var_set(ctx, A, B, sink_str_newblob(ctx, s.size, s.bytes));
				}
				else
					var_set(ctx, A, B, (sink_val){ .u = SINK_TAG_STR | C });
			} break;

			case op_enum.LIST           : { // [TGT], HINT
				LOAD_abc();
				if (C <= 0)
					var_set(ctx, A, B, sink_list_newempty(ctx));
				else{
					var_set(ctx, A, B,
						sink_list_newblobgive(ctx, 0, C, mem_alloc(sizeof(sink_val) * C)));
				}
			} break;

			case op_enum.ISNUM          : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				var_set(ctx, A, B, sink_bool(sink_isnum(X)));
			} break;

			case op_enum.ISSTR          : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				var_set(ctx, A, B, sink_bool(sink_isstr(X)));
			} break;

			case op_enum.ISLIST         : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				var_set(ctx, A, B, sink_bool(sink_islist(X)));
			} break;

			case op_enum.NOT            : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				var_set(ctx, A, B, sink_bool(sink_isfalse(X)));
			} break;

			case op_enum.SIZE           : { // [TGT], [SRC]
				LOAD_abcd();
				var_set(ctx, A, B, sink_num(sink_size(ctx, var_get(ctx, C, D))));
				if (ctx.failed)
					return SINK_RUN_FAIL;
			} break;

			case op_enum.TONUM          : { // [TGT], [SRC]
				LOAD_abcd();
				var_set(ctx, A, B, sink_tonum(ctx, var_get(ctx, C, D)));
				if (ctx.failed)
					return SINK_RUN_FAIL;
			} break;

			case op_enum.CAT            : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				bool listcat = C > 0;
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
					if (!sink_islist(p[D]))
						listcat = false;
				}
				if (listcat)
					var_set(ctx, A, B, sink_list_cat(ctx, C, p));
				else{
					var_set(ctx, A, B, sink_str_cat(ctx, C, p));
					if (ctx.failed)
						return SINK_RUN_FAIL;
				}
			} break;

			case op_enum.LT             : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				if (sink_isstr(X) && sink_isstr(Y)){
					if (X.u === Y.u)
						var_set(ctx, A, B, sink_bool(false));
					else{
						var_set(ctx, A, B,
							sink_bool(str_cmp(var_caststr(ctx, X), var_caststr(ctx, Y)) < 0));
					}
				}
				else if (sink_isnum(X) && sink_isnum(Y))
					var_set(ctx, A, B, sink_bool(X.f < Y.f));
				else
					return opi_abort(ctx, "Expecting numbers or strings");
			} break;

			case op_enum.LTE            : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				if (sink_isstr(X) && sink_isstr(Y)){
					if (X.u === Y.u)
						var_set(ctx, A, B, sink_bool(true));
					else{
						var_set(ctx, A, B,
							sink_bool(str_cmp(var_caststr(ctx, X), var_caststr(ctx, Y)) <= 0));
					}
				}
				else if (sink_isnum(X) && sink_isnum(Y))
					var_set(ctx, A, B, sink_bool(X.f <= Y.f));
				else
					return opi_abort(ctx, "Expecting numbers or strings");
			} break;

			case op_enum.NEQ            : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				var_set(ctx, A, B, sink_bool(!opi_equ(ctx, X, Y)));
			} break;

			case op_enum.EQU            : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				var_set(ctx, A, B, sink_bool(opi_equ(ctx, X, Y)));
			} break;

			case op_enum.GETAT          : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				if (!sink_islist(X) && !sink_isstr(X))
					return opi_abortcstr(ctx, "Expecting list or string when indexing");
				Y = var_get(ctx, E, F);
				if (!sink_isnum(Y))
					return opi_abortcstr(ctx, "Expecting index to be number");
				I = Y.f;
				if (sink_islist(X)){
					ls = var_castlist(ctx, X);
					if (I < 0)
						I += ls->size;
					if (I < 0 || I >= ls->size)
						var_set(ctx, A, B, SINK_NIL);
					else
						var_set(ctx, A, B, ls->vals[I]);
				}
				else{
					str = var_caststr(ctx, X);
					if (I < 0)
						I += str->size;
					if (I < 0 || I >= str->size)
						var_set(ctx, A, B, SINK_NIL);
					else
						var_set(ctx, A, B, sink_str_newblob(ctx, 1, &str->bytes[I]));
				}
			} break;

			case op_enum.SLICE          : { // [TGT], [SRC1], [SRC2], [SRC3]
				LOAD_abcdefgh();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				Z = var_get(ctx, G, H);
				if (sink_islist(X))
					var_set(ctx, A, B, sink_list_slice(ctx, X, Y, Z));
				else
					var_set(ctx, A, B, sink_str_slice(ctx, X, Y, Z));
				if (ctx.failed)
					return SINK_RUN_FAIL;
			} break;

			case op_enum.SETAT          : { // [SRC1], [SRC2], [SRC3]
				LOAD_abcdef();
				X = var_get(ctx, A, B);
				if (!sink_islist(X))
					return opi_abort(ctx, "Expecting list when setting index");
				Y = var_get(ctx, C, D);
				if (!sink_isnum(Y))
					return opi_abort(ctx, "Expecting index to be number");
				ls = var_castlist(ctx, X);
				A = (int)Y.f;
				if (A < 0)
					A += ls.size;
				while (ls.length < A + 1)
					ls.push(SINK_NIL);
				if (A >= 0 && A < ls.size)
					ls.vals[A] = var_get(ctx, E, F);
			} break;

			case op_enum.SPLICE         : { // [SRC1], [SRC2], [SRC3], [SRC4]
				LOAD_abcdefgh();
				X = var_get(ctx, A, B);
				Y = var_get(ctx, C, D);
				Z = var_get(ctx, E, F);
				W = var_get(ctx, G, H);
				if (sink_islist(X))
					sink_list_splice(ctx, X, Y, Z, W);
				else if (sink_isstr(X))
					var_set(ctx, A, B, sink_str_splice(ctx, X, Y, Z, W));
				else
					return opi_abort(ctx, "Expecting list or string when splicing");
			} break;

			case op_enum.JUMP           : { // [[LOCATION]]
				LOAD_abcd();
				A = A + (B << 8) + (C << 16) + ((D << 23) * 2);
				if (ctx.prg.repl && A === -1){
					ctx.pc -= 5;
					return SINK_RUN_REPLMORE;
				}
				ctx.pc = A;
			} break;

			case op_enum.JUMPTRUE       : { // [SRC], [[LOCATION]]
				LOAD_abcdef();
				C = C + (D << 8) + (E << 16) + ((F << 23) * 2);
				if (!sink_isnil(var_get(ctx, A, B))){
					if (ctx.prg.repl && C === -1){
						ctx.pc -= 7;
						return SINK_RUN_REPLMORE;
					}
					ctx.pc = C;
				}
			} break;

			case op_enum.JUMPFALSE      : { // [SRC], [[LOCATION]]
				LOAD_abcdef();
				C = C + (D << 8) + (E << 16) + ((F << 23) * 2);
				if (sink_isnil(var_get(ctx, A, B))){
					if (ctx.prg.repl && C === -1){
						ctx.pc -= 7;
						return SINK_RUN_REPLMORE;
					}
					ctx.pc = C;
				}
			} break;

			case op_enum.CMDTAIL        : { //
				ccs s = list_ptr_pop(ctx.call_stk);
				lxs lx = ctx.lex_stk.ptrs[ctx.lex_index];
				ctx.lex_stk.ptrs[ctx.lex_index] = lx.next;
				lxs_release(ctx, lx);
				ctx.lex_index = s.lex_index;
				var_set(ctx, s.frame, s.index, SINK_NIL);
				ctx.pc = s.pc;
				ccs_release(ctx, s);
			} break;

			case op_enum.CALL           : { // [TGT], [[LOCATION]], ARGCOUNT, [ARGS]...
				LOAD_abcdefg();
				C = C + (D << 8) + (E << 16) + ((F << 23) * 2);
				if (C === -1){
					ctx.pc -= 8;
					return SINK_RUN_REPLMORE;
				}
				for (I = 0; I < G; I++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[I] = var_get(ctx, E, F);
				}
				list_ptr_push(ctx.call_stk, ccs_get(ctx, ctx.pc, A, B, ctx.lex_index));
				ctx.pc = C - 1;
				LOAD_abc();
				// A is op_enum.CMDHEAD
				if (C !== 0xFF){
					if (G <= C){
						while (G < C)
							p[G++] = SINK_NIL;
						p[G] = sink_list_newempty(ctx);
					}
					else
						p[C] = sink_list_newblob(ctx, G - C, &p[C]);
					G = C + 1;
				}
				ctx.lex_index = B;
				while (ctx.lex_index >= ctx.lex_stk.size)
					list_ptr_push(ctx.lex_stk, NULL);
				ctx.lex_stk.ptrs[ctx.lex_index] =
					lxs_get(ctx, G, p, ctx.lex_stk.ptrs[ctx.lex_index]);
			} break;

			case op_enum.NATIVE         : { // [TGT], [[INDEX]], ARGCOUNT, [ARGS]...
				LOAD_abcdefg();
				for (I = 0; I < G; I++){
					J = ops.bytes[ctx.pc++]; H = ops.bytes[ctx.pc++];
					p[I] = var_get(ctx, J, H);
				}
				C = C + (D << 8) + (E << 16) + ((F << 23) * 2);
				native nat = NULL;
				if (ctx.prg.repl){
					// if REPL, then we need to search for the hash
					uint64_t hash = ctx.prg.keyTable.vals[C];
					for (int i = 0; i < ctx.natives.size; i++){
						native nat2 = ctx.natives.ptrs[i];
						if (nat2.hash === hash){
							nat = nat2;
							break;
						}
					}
				}
				else
					nat = ctx.natives.ptrs[C];
				if (nat === NULL || nat.f_native === NULL)
					return opi_abort(ctx, "Native call not implemented");
				X = nat.f_native(ctx, G, p, nat.natuser);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				if (sink_isasync(X)){
					ctx.async_frame = A;
					ctx.async_index = B;
					ctx.timeout_left = ctx.timeout;
					ctx.async = true;
					return SINK_RUN_ASYNC;
				}
				var_set(ctx, A, B, X);
			} break;

			case op_enum.RETURN         : { // [SRC]
				if (ctx.call_stk.size <= 0)
					return opi_exit(ctx);
				LOAD_ab();
				X = var_get(ctx, A, B);
				ccs s = list_ptr_pop(ctx.call_stk);
				lxs lx = ctx.lex_stk.ptrs[ctx.lex_index];
				ctx.lex_stk.ptrs[ctx.lex_index] = lx.next;
				lxs_release(ctx, lx);
				ctx.lex_index = s.lex_index;
				var_set(ctx, s.frame, s.index, X);
				ctx.pc = s.pc;
				ccs_release(ctx, s);
			} break;

			case op_enum.RETURNTAIL     : { // [[LOCATION]], ARGCOUNT, [ARGS]...
				LOAD_abcde();
				A = A + (B << 8) + (C << 16) + ((D << 23) * 2);
				if (A === -1){
					ctx.pc -= 6;
					return SINK_RUN_REPLMORE;
				}
				for (I = 0; I < E; I++){
					G = ops.bytes[ctx.pc++]; H = ops.bytes[ctx.pc++];
					p[I] = var_get(ctx, G, H);
				}
				ctx.pc = A - 1;
				LOAD_abc();
				if (C !== 0xFF){
					if (E <= C){
						while (E < C)
							p[E++] = SINK_NIL;
						p[E] = sink_list_newempty(ctx);
					}
					else
						p[C] = sink_list_newblob(ctx, E - C, &p[C]);
					E = C + 1;
				}
				lxs lx = ctx.lex_stk.ptrs[ctx.lex_index];
				lxs lx2 = lx.next;
				lxs_release(ctx, lx);
				ctx.lex_stk.ptrs[ctx.lex_index] = lxs_get(ctx, E, p, lx2);
			} break;

			case op_enum.RANGE          : { // [TGT], [SRC1], [SRC2], [SRC3]
				LOAD_abcdefgh();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				Z = var_get(ctx, G, H);
				if (!sink_isnum(X))
					return opi_abort(ctx, "Expecting number for range");
				if (sink_isnum(Y)){
					if (sink_isnil(Z))
						Z = sink_num(1);
					if (!sink_isnum(Z))
						return opi_abort(ctx, "Expecting number for range step");
					X = sink_range(ctx, X.f, Y.f, Z.f);
				}
				else if (sink_isnil(Y)){
					if (!sink_isnil(Z))
						return opi_abort(ctx, "Expecting number for range stop");
					X = sink_range(ctx, 0, X.f, 1);
				}
				else
					return opi_abort(ctx, "Expecting number for range stop");
				var_set(ctx, A, B, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
			} break;

			case op_enum.ORDER          : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				var_set(ctx, A, B, sink_num(sink_order(ctx, X, Y)));
			} break;

			case op_enum.SAY            : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				sink_say(ctx, C, p);
				var_set(ctx, A, B, SINK_NIL);
				if (ctx.failed)
					return SINK_RUN_FAIL;
			} break;

			case op_enum.WARN           : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				sink_warn(ctx, C, p);
				var_set(ctx, A, B, SINK_NIL);
				if (ctx.failed)
					return SINK_RUN_FAIL;
			} break;

			case op_enum.ASK            : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				var_set(ctx, A, B, sink_ask(ctx, C, p));
				if (ctx.failed)
					return SINK_RUN_FAIL;
			} break;

			case op_enum.EXIT           : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				if (C > 0){
					sink_say(ctx, C, p);
					if (ctx.failed)
						return SINK_RUN_FAIL;
				}
				return opi_exit(ctx);
			} break;

			case op_enum.ABORT          : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				char *err = NULL;
				if (C > 0)
					err = (char *)sink_list_joinplain(C, p, 1, (const uint8_t *)" ", &A);
				return opi_abort(ctx, err);
			} break;

			case op_enum.STACKTRACE     : { // [TGT]
				LOAD_ab();
				var_set(ctx, A, B, sink_stacktrace(ctx));
			} break;

			case op_enum.NUM_NEG        : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_neg, txt_num_neg)
			} break;

			case op_enum.NUM_ADD        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_num_add, txt_num_add)
			} break;

			case op_enum.NUM_SUB        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_num_sub, txt_num_sub)
			} break;

			case op_enum.NUM_MUL        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_num_mul, txt_num_mul)
			} break;

			case op_enum.NUM_DIV        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_num_div, txt_num_div)
			} break;

			case op_enum.NUM_MOD        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_num_mod, txt_num_mod)
			} break;

			case op_enum.NUM_POW        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_num_pow, txt_num_pow)
			} break;

			case op_enum.NUM_ABS        : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_abs, txt_num_abs)
			} break;

			case op_enum.NUM_SIGN       : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_sign, txt_num_sign)
			} break;

			case op_enum.NUM_MAX        : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				var_set(ctx, A, B, opi_num_max(ctx, C, p));
			} break;

			case op_enum.NUM_MIN        : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				var_set(ctx, A, B, opi_num_min(ctx, C, p));
			} break;

			case op_enum.NUM_CLAMP      : { // [TGT], [SRC1], [SRC2], [SRC3]
				INLINE_TRIOP(triop_num_clamp, txt_num_clamp)
			} break;

			case op_enum.NUM_FLOOR      : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_floor, txt_num_floor)
			} break;

			case op_enum.NUM_CEIL       : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_ceil, txt_num_ceil)
			} break;

			case op_enum.NUM_ROUND      : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_round, txt_num_round)
			} break;

			case op_enum.NUM_TRUNC      : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_trunc, txt_num_trunc)
			} break;

			case op_enum.NUM_NAN        : { // [TGT]
				LOAD_ab();
				var_set(ctx, A, B, sink_num_nan());
			} break;

			case op_enum.NUM_INF        : { // [TGT]
				LOAD_ab();
				var_set(ctx, A, B, sink_num_inf());
			} break;

			case op_enum.NUM_ISNAN      : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_isnan, txt_num_isnan)
			} break;

			case op_enum.NUM_ISFINITE   : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_isfinite, txt_num_isfinite)
			} break;

			case op_enum.NUM_SIN        : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_sin, txt_num_sin)
			} break;

			case op_enum.NUM_COS        : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_cos, txt_num_cos)
			} break;

			case op_enum.NUM_TAN        : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_tan, txt_num_tan)
			} break;

			case op_enum.NUM_ASIN       : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_asin, txt_num_asin)
			} break;

			case op_enum.NUM_ACOS       : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_acos, txt_num_acos)
			} break;

			case op_enum.NUM_ATAN       : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_atan, txt_num_atan)
			} break;

			case op_enum.NUM_ATAN2      : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_num_atan2, txt_num_atan)
			} break;

			case op_enum.NUM_LOG        : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_log, txt_num_log)
			} break;

			case op_enum.NUM_LOG2       : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_log2, txt_num_log)
			} break;

			case op_enum.NUM_LOG10      : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_log10, txt_num_log)
			} break;

			case op_enum.NUM_EXP        : { // [TGT], [SRC]
				INLINE_UNOP(unop_num_exp, txt_num_pow)
			} break;

			case op_enum.NUM_LERP       : { // [TGT], [SRC1], [SRC2], [SRC3]
				INLINE_TRIOP(triop_num_lerp, txt_num_lerp)
			} break;

			case op_enum.NUM_HEX        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP_T(binop_num_hex, txt_num_hex, LT_ALLOWNUM,
					LT_ALLOWNUM | LT_ALLOWNIL)
			} break;

			case op_enum.NUM_OCT        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP_T(binop_num_oct, txt_num_oct, LT_ALLOWNUM,
					LT_ALLOWNUM | LT_ALLOWNIL)
			} break;

			case op_enum.NUM_BIN        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP_T(binop_num_bin, txt_num_bin, LT_ALLOWNUM,
					LT_ALLOWNUM | LT_ALLOWNIL)
			} break;

			case op_enum.INT_NEW        : { // [TGT], [SRC]
				INLINE_UNOP(unop_int_new, txt_int_new)
			} break;

			case op_enum.INT_NOT        : { // [TGT], [SRC]
				INLINE_UNOP(unop_int_not, txt_int_not)
			} break;

			case op_enum.INT_AND        : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				X = opi_combop(ctx, C, p, binop_int_and, txt_int_and);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.INT_OR         : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				X = opi_combop(ctx, C, p, binop_int_or, txt_int_or);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.INT_XOR        : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				X = opi_combop(ctx, C, p, binop_int_xor, txt_int_xor);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.INT_SHL        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_int_shl, txt_int_shl)
			} break;

			case op_enum.INT_SHR        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_int_shr, txt_int_shr)
			} break;

			case op_enum.INT_SAR        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_int_sar, txt_int_shr)
			} break;

			case op_enum.INT_ADD        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_int_add, txt_num_add)
			} break;

			case op_enum.INT_SUB        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_int_sub, txt_num_sub)
			} break;

			case op_enum.INT_MUL        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_int_mul, txt_num_mul)
			} break;

			case op_enum.INT_DIV        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_int_div, txt_num_div)
			} break;

			case op_enum.INT_MOD        : { // [TGT], [SRC1], [SRC2]
				INLINE_BINOP(binop_int_mod, txt_num_mod)
			} break;

			case op_enum.INT_CLZ        : { // [TGT], [SRC]
				INLINE_UNOP(unop_int_clz, txt_int_clz)
			} break;

			case op_enum.INT_POP        : { // [TGT], [SRC]
				INLINE_UNOP(unop_int_pop, txt_int_pop)
			} break;

			case op_enum.INT_BSWAP      : { // [TGT], [SRC]
				INLINE_UNOP(unop_int_bswap, txt_int_bswap)
			} break;

			case op_enum.RAND_SEED      : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				if (sink_isnil(X))
					X.f = 0;
				else if (!sink_isnum(X))
					return opi_abort(ctx, "Expecting number");
				sink_rand_seed(ctx, X.f);
				var_set(ctx, A, B, SINK_NIL);
			} break;

			case op_enum.RAND_SEEDAUTO  : { // [TGT]
				LOAD_ab();
				sink_rand_seedauto(ctx);
				var_set(ctx, A, B, SINK_NIL);
			} break;

			case op_enum.RAND_INT       : { // [TGT]
				LOAD_ab();
				var_set(ctx, A, B, sink_num(sink_rand_int(ctx)));
			} break;

			case op_enum.RAND_NUM       : { // [TGT]
				LOAD_ab();
				var_set(ctx, A, B, sink_num(sink_rand_num(ctx)));
			} break;

			case op_enum.RAND_GETSTATE  : { // [TGT]
				LOAD_ab();
				var_set(ctx, A, B, sink_rand_getstate(ctx));
			} break;

			case op_enum.RAND_SETSTATE  : { // [TGT], [SRC]
				LOAD_abcd();
				sink_rand_setstate(ctx, var_get(ctx, C, D));
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, SINK_NIL);
			} break;

			case op_enum.RAND_PICK      : { // [TGT], [SRC]
				LOAD_abcd();
				X = sink_rand_pick(ctx, var_get(ctx, C, D));
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.RAND_SHUFFLE   : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				sink_rand_shuffle(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_NEW        : { // [TGT], ARGCOUNT, [ARGS]...
				LOAD_abc();
				for (D = 0; D < C; D++){
					E = ops.bytes[ctx.pc++]; F = ops.bytes[ctx.pc++];
					p[D] = var_get(ctx, E, F);
				}
				var_set(ctx, A, B, sink_str_new(ctx, C, p));
			} break;

			case op_enum.STR_SPLIT      : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_str_split(ctx, X, Y);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_REPLACE    : { // [TGT], [SRC1], [SRC2], [SRC3]
				LOAD_abcdefgh();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				Z = var_get(ctx, G, H);
				X = sink_str_replace(ctx, X, Y, Z);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_BEGINS     : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_bool(sink_str_begins(ctx, X, Y));
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_ENDS       : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_bool(sink_str_ends(ctx, X, Y));
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_PAD        : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				if (sink_isnil(Y))
					Y.f = 0;
				else if (!sink_isnum(Y))
					return opi_abort(ctx, "Expecting number");
				X = sink_str_pad(ctx, X, Y.f);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_FIND       : { // [TGT], [SRC1], [SRC2], [SRC3]
				LOAD_abcdefgh();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				Z = var_get(ctx, G, H);
				X = sink_str_find(ctx, X, Y, Z);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_RFIND      : { // [TGT], [SRC1], [SRC2], [SRC3]
				LOAD_abcdefgh();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				Z = var_get(ctx, G, H);
				X = sink_str_rfind(ctx, X, Y, Z);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_LOWER      : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_str_lower(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_UPPER      : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_str_upper(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_TRIM       : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_str_trim(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_REV        : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_str_rev(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_REP        : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				if (sink_isnil(Y))
					Y.f = 0;
				else if (!sink_isnum(Y))
					return opi_abort(ctx, "Expecting number");
				X = sink_str_rep(ctx, X, Y.f);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_LIST       : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_str_list(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_BYTE       : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				if (sink_isnil(Y))
					Y.f = 0;
				else if (!sink_isnum(Y))
					return opi_abort(ctx, "Expecting number");
				X = sink_str_byte(ctx, X, Y.f);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.STR_HASH       : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				if (sink_isnil(Y))
					Y.f = 0;
				else if (!sink_isnum(Y))
					return opi_abort(ctx, "Expecting number");
				X = sink_str_hash(ctx, X, Y.f);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.UTF8_VALID     : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				var_set(ctx, A, B, sink_bool(sink_utf8_valid(ctx, X)));
			} break;

			case op_enum.UTF8_LIST      : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_utf8_list(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.UTF8_STR       : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_utf8_str(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.struct_enum.SIZE    : { // [TGT], [SRC]
				LOAD_abcd();
				var_set(ctx, A, B, sink_struct_size(ctx, var_get(ctx, C, D)));
			} break;

			case op_enum.struct_enum.STR     : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_struct_str(ctx, X, Y);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.struct_enum.LIST    : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_struct_list(ctx, X, Y);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.struct_enum.ISLE    : { // [TGT]
				LOAD_ab();
				var_set(ctx, A, B, sink_bool(sink_struct_isLE()));
			} break;

			case op_enum.LIST_NEW       : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_list_new(ctx, X, Y);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_SHIFT     : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_list_shift(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_POP       : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_list_pop(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_PUSH      : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_list_push(ctx, X, Y);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_UNSHIFT   : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_list_unshift(ctx, X, Y);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_APPEND    : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_list_append(ctx, X, Y);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_PREPEND   : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_list_prepend(ctx, X, Y);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_FIND      : { // [TGT], [SRC1], [SRC2], [SRC3]
				LOAD_abcdefgh();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				Z = var_get(ctx, G, H);
				X = sink_list_find(ctx, X, Y, Z);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_RFIND     : { // [TGT], [SRC1], [SRC2], [SRC3]
				LOAD_abcdefgh();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				Z = var_get(ctx, G, H);
				X = sink_list_rfind(ctx, X, Y, Z);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_JOIN      : { // [TGT], [SRC1], [SRC2]
				LOAD_abcdef();
				X = var_get(ctx, C, D);
				Y = var_get(ctx, E, F);
				X = sink_list_join(ctx, X, Y);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_REV       : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_list_rev(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_STR       : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_list_str(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_SORT      : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				sink_list_sort(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.LIST_RSORT     : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				sink_list_rsort(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.PICKLE_JSON    : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_pickle_json(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.PICKLE_BIN     : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_pickle_bin(ctx, X);
				if (ctx.failed) // can fail in C impl because of sink_type.ASYNC
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.PICKLE_VAL     : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_pickle_val(ctx, X);
				if (ctx.failed)
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.PICKLE_VALID   : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				E = sink_pickle_valid(ctx, X);
				var_set(ctx, A, B, E === 0 ? SINK_NIL : sink_num(E));
			} break;

			case op_enum.PICKLE_SIBLING : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				var_set(ctx, A, B, sink_bool(sink_pickle_sibling(ctx, X)));
			} break;

			case op_enum.PICKLE_CIRCULAR: { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				var_set(ctx, A, B, sink_bool(sink_pickle_circular(ctx, X)));
			} break;

			case op_enum.PICKLE_COPY    : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				X = sink_pickle_copy(ctx, X);
				if (ctx.failed) // can fail in C impl because of sink_type.ASYNC
					return SINK_RUN_FAIL;
				var_set(ctx, A, B, X);
			} break;

			case op_enum.GC_GETLEVEL    : { // [TGT]
				LOAD_ab();
				switch (ctx.gc_level){
					case SINK_GC_NONE:
						var_set(ctx, A, B, sink_str_newcstr(ctx, "none"));
						break;
					case SINK_GC_DEFAULT:
						var_set(ctx, A, B, sink_str_newcstr(ctx, "default"));
						break;
					case SINK_GC_LOWMEM:
						var_set(ctx, A, B, sink_str_newcstr(ctx, "lowmem"));
						break;
				}
			} break;

			case op_enum.GC_SETLEVEL    : { // [TGT], [SRC]
				LOAD_abcd();
				X = var_get(ctx, C, D);
				if (!sink_isstr(X))
					return opi_abort(ctx, "Expecting one of 'none', 'default', or 'lowmem'");
				str = var_caststr(ctx, X);
				if (strcmp((const char *)str.bytes, "none") === 0)
					ctx.gc_level = SINK_GC_NONE;
				else if (strcmp((const char *)str.bytes, "default") === 0){
					ctx.gc_level = SINK_GC_DEFAULT;
					context_gcleft(ctx, false);
				}
				else if (strcmp((const char *)str.bytes, "lowmem") === 0){
					ctx.gc_level = SINK_GC_LOWMEM;
					context_gcleft(ctx, false);
				}
				else
					return opi_abort(ctx, "Expecting one of 'none', 'default', or 'lowmem'");
				var_set(ctx, A, B, SINK_NIL);
			} break;

			case op_enum.GC_RUN         : { // [TGT]
				LOAD_ab();
				context_gc(ctx);
				var_set(ctx, A, B, SINK_NIL);
			} break;

			default: break;
		}
		if (ctx.gc_level !== SINK_GC_NONE){
			ctx.gc_left--;
			if (ctx.gc_left <= 0)
				context_gc(ctx);
		}
		if (ctx.timeout > 0){
			ctx.timeout_left--;
			if (ctx.timeout_left <= 0){
				ctx.timeout_left = ctx.timeout;
				return SINK_RUN_TIMEOUT;
			}
		}
	}

	#undef LOAD_ab
	#undef LOAD_abc
	#undef LOAD_abcd
	#undef LOAD_abcde
	#undef LOAD_abcdef
	#undef LOAD_abcdefg
	#undef LOAD_abcdefgh
	#undef LOAD_abcdefghi
	#undef LOAD_abcdefghij
	#undef INLINE_UNOP
	#undef INLINE_BINOP
	#undef INLINE_TRIOP
	#undef RETURN_FAIL

	if (ctx.prg.repl)
		return SINK_RUN_REPLMORE;
	return opi_exit(ctx);
}

//
// compiler
//
*/
interface filepos_node_st {
	lx: lex_st;
	tks: tok_st[];
	stmts: ast_st[];
	pgstate: pgst_st[];
	next: filepos_node_st | null;
	flp: filepos_st;
	wascr: boolean;
}
/*
static filepos_node flpn_new(int fullfile, int basefile, filepos_node next){
	filepos_node flpn = mem_alloc(sizeof(filepos_node_st));
	flpn.lx = lex_new();
	flpn.tks = list_ptr_new(tok_free);
	flpn.pgstate = list_ptr_new(pgst_free);
	flpn.flp.fullfile = fullfile;
	flpn.flp.basefile = basefile;
	flpn.flp.line = 1;
	flpn.flp.chr = 1;
	flpn.wascr = false;
	flpn.next = next;
	return flpn;
}

static void flpn_free(filepos_node flpn){
	lex_free(flpn.lx);
	list_ptr_free(flpn.tks);
	list_ptr_free(flpn.pgstate);
	mem_free(flpn);
}
*/
interface staticinc_st {
	name: string[];
	type: number[]; // 0 = body, 1 = file
	content: string[];
}
/*
static inline staticinc staticinc_new(){
	staticinc sinc = mem_alloc(sizeof(staticinc_st));
	sinc.name = list_ptr_new(NULL);
	sinc.type = list_byte_new();
	sinc.content = list_ptr_new(NULL);
	return sinc;
}

static inline void staticinc_addbody(staticinc sinc, const char *name, const char *body){
	list_ptr_push(sinc.name, (void *)name);
	list_byte_push(sinc.type, 0);
	list_ptr_push(sinc.content, (void *)body);
}

static inline void staticinc_addfile(staticinc sinc, const char *name, const char *file){
	list_ptr_push(sinc.name, (void *)name);
	list_byte_push(sinc.type, 1);
	list_ptr_push(sinc.content, (void *)file);
}

static inline void staticinc_free(staticinc sinc){
	list_ptr_free(sinc.name);
	list_byte_free(sinc.type);
	list_ptr_free(sinc.content);
	mem_free(sinc);
}
*/
interface compiler_st {
	sinc: staticinc_st;
	pr: parser_st;
	scr: script_st;
	prg: program_st;
	paths: string[];
	sym: symtbl_st;
	flpn: filepos_node_st;
	inc: sink_inc_st;
	msg: string;
}
/*
static inline int script_addfile(script scr, const char *file);

static compiler compiler_new(script scr, program prg, staticinc sinc, sink_inc_st inc,
	const char *file, list_ptr paths){
	compiler cmp = mem_alloc(sizeof(compiler_st));
	cmp.sinc = sinc;
	cmp.pr = parser_new();
	cmp.scr = scr;
	cmp.prg = prg;
	cmp.paths = paths;
	cmp.sym = symtbl_new(prg.repl);
	symtbl_loadStdlib(cmp.sym);
	cmp.flpn = flpn_new(script_addfile(scr, file), program_addfile(prg, file), NULL);
	cmp.inc = inc;
	cmp.msg = NULL;
	return cmp;
}

static inline void compiler_setmsg(compiler cmp, char *msg){
	if (cmp.msg)
		mem_free(cmp.msg);
	cmp.msg = msg;
}

static void compiler_reset(compiler cmp){
	compiler_setmsg(cmp, NULL);
	lex_reset(cmp.flpn.lx);
	parser_free(cmp.pr);
	cmp.pr = parser_new();

	list_ptr_free(cmp.flpn.tks);
	cmp.flpn.tks = list_ptr_new(tok_free);

	list_ptr_free(cmp.flpn.pgstate);
	cmp.flpn.pgstate = list_ptr_new(pgst_free);
}

static char *compiler_write(compiler cmp, int size, const uint8_t *bytes);
static char *compiler_closeLexer(compiler cmp);

static bool compiler_begininc(compiler cmp, list_ptr names, const char *file){
	cmp.flpn = flpn_new(
		script_addfile(cmp.scr, file), program_addfile(cmp.prg, file), cmp.flpn);
	if (names){
		char *smsg = symtbl_pushNamespace(cmp.sym, names);
		if (smsg){
			filepos_node del = cmp.flpn;
			cmp.flpn = cmp.flpn.next;
			flpn_free(del);
			compiler_setmsg(cmp, smsg);
			return false;
		}
	}
	return true;
}

typedef struct {
	compiler cmp;
	list_ptr names;
} compiler_fileres_user_st, *compiler_fileres_user;

static bool compiler_begininc_cfu(const char *file, compiler_fileres_user cfu){
	return compiler_begininc(cfu.cmp, cfu.names, file);
}

static void compiler_endinc(compiler cmp, bool ns){
	if (ns)
		symtbl_popNamespace(cmp.sym);
	filepos_node del = cmp.flpn;
	cmp.flpn = cmp.flpn.next;
	flpn_free(del);
}

static void compiler_endinc_cfu(bool success, const char *file, compiler_fileres_user cfu){
	if (success)
		compiler_closeLexer(cfu.cmp);
	compiler_endinc(cfu.cmp, cfu.names !== NULL);
	if (!success && cfu.cmp.msg === NULL)
		compiler_setmsg(cfu.cmp, format("Failed to read file: %s", file));
}

static bool compiler_staticinc(compiler cmp, list_ptr names, const char *file, const char *body){
	if (!compiler_begininc(cmp, names, file))
		return false;
	char *err = compiler_write(cmp, (int)strlen(body), (const uint8_t *)body);
	if (err){
		compiler_endinc(cmp, names !== NULL);
		return false;
	}
	err = compiler_closeLexer(cmp);
	compiler_endinc(cmp, names !== NULL);
	if (err)
		return false;
	return true;
}

static bool compiler_dynamicinc(compiler cmp, list_ptr names, const char *file, const char *from){
	compiler_fileres_user_st cfu;
	cfu.cmp = cmp;
	cfu.names = names;
	char *cwd = NULL;
	if (from)
		cwd = pathjoin(from, "..");
	bool res = fileres_read(cmp.scr, true, file, cwd,
		(f_fileres_begin_f)compiler_begininc_cfu, (f_fileres_end_f)compiler_endinc_cfu, &cfu);
	if (cwd)
		mem_free(cwd);
	return res;
}

static char *compiler_process(compiler cmp){
	// generate statements
	list_ptr stmts = list_ptr_new(ast_free);
	while (cmp.flpn.tks.size > 0){
		while (cmp.flpn.tks.size > 0){
			tok tk = list_ptr_shift(cmp.flpn.tks);
			tok_print(tk);
			if (tk.type === tok_enum.ERROR){
				compiler_setmsg(cmp, program_errormsg(cmp.prg, tk.flp, tk.u.msg));
				tok_free(tk);
				list_ptr_free(stmts);
				return cmp.msg;
			}
			const char *pmsg = parser_add(cmp.pr, tk, stmts);
			if (pmsg){
				compiler_setmsg(cmp, program_errormsg(cmp.prg, tk.flp, pmsg));
				list_ptr_free(stmts);
				return cmp.msg;
			}
			if (stmts.size > 0 && ((ast)stmts.ptrs[stmts.size - 1]).type === ast_enum.INCLUDE)
				break;
		}

		// process statements
		while (stmts.size > 0){
			ast stmt = list_ptr_shift(stmts);
			ast_print(stmt);

			if (stmt.type === ast_enum.INCLUDE){
				// intercept include statements to process by the compiler
				for (int ii = 0; ii < stmt.u.incls.size; ii++){
					incl inc = stmt.u.incls.ptrs[ii];
					const char *file = (const char *)inc.file.bytes;

					// look if file matches a static include pseudo-file
					bool internal = false;
					for (int i = 0; i < cmp.sinc.name.size; i++){
						const char *sinc_name = cmp.sinc.name.ptrs[i];
						if (strcmp(file, sinc_name) === 0){
							internal = true;
							const char *sinc_content = cmp.sinc.content.ptrs[i];
							bool is_body = cmp.sinc.type.bytes[i] === 0;
							bool success;
							if (is_body)
								success = compiler_staticinc(cmp, inc.names, file, sinc_content);
							else{
								success = compiler_dynamicinc(cmp, inc.names, sinc_content,
									script_getfile(cmp.scr, stmt.flp.fullfile));
								if (!success){
									compiler_setmsg(cmp,
										format("Failed to include: %s", file));
								}
							}
							if (!success){
								ast_free(stmt);
								list_ptr_free(stmts);
								return cmp.msg;
							}
							break;
						}
					}

					if (!internal){
						bool found = compiler_dynamicinc(cmp, inc.names, file,
							script_getfile(cmp.scr, stmt.flp.fullfile));
						if (!found && cmp.msg === NULL)
							compiler_setmsg(cmp, format("Failed to include: %s", file));
						if (cmp.msg){
							ast_free(stmt);
							list_ptr_free(stmts);
							return cmp.msg;
						}
					}
				}
			}
			else{
				list_ptr pgsl = cmp.flpn.pgstate;
				pgr_st pg = program_gen((pgen_st){
						.prg = cmp.prg,
						.sym = cmp.sym,
						.scr = cmp.scr,
						.from = stmt.flp.fullfile
					}, stmt,
					pgsl.size <= 0 ? NULL : ((pgst)pgsl.ptrs[pgsl.size - 1]).state,
					cmp.prg.repl && cmp.flpn.next === NULL && pgsl.size <= 0);
				symtbl_print(cmp.sym);
				switch (pg.type){
					case PGR_OK:
						break;
					case PGR_PUSH:
						list_ptr_push(pgsl, pg.u.push.pgs);
						break;
					case PGR_POP:
						pgst_free(list_ptr_pop(pgsl));
						break;
					case PGR_ERROR:
						compiler_setmsg(cmp,
							program_errormsg(cmp.prg, pg.u.error.flp, pg.u.error.msg));
						ast_free(stmt);
						mem_free(pg.u.error.msg);
						list_ptr_free(stmts);
						return cmp.msg;
					case PGR_FORVARS:
						// impossible
						assert(false);
						break;
				}
			}
			ast_free(stmt);
		}
	}
	list_ptr_free(stmts);
	return null;
}

static char *compiler_write(compiler cmp, int size, const uint8_t *bytes){
	filepos_node flpn = cmp.flpn;
	for (int i = 0; i < size; i++){
		lex_add(flpn.lx, flpn.flp, bytes[i], flpn.tks);
		if (bytes[i] === '\n'){
			if (!flpn.wascr){
				flpn.flp.line++;
				flpn.flp.chr = 1;
			}
			flpn.wascr = false;
		}
		else if (bytes[i] === '\r'){
			flpn.flp.line++;
			flpn.flp.chr = 1;
			flpn.wascr = true;
		}
		else{
			flpn.flp.chr++;
			flpn.wascr = false;
		}
	}
	return compiler_process(cmp);
}

static char *compiler_closeLexer(compiler cmp){
	lex_close(cmp.flpn.lx, cmp.flpn.flp, cmp.flpn.tks);
	return compiler_process(cmp);
}

static char *compiler_close(compiler cmp){
	char *err = compiler_closeLexer(cmp);
	if (err)
		return err;

	const char *pmsg = parser_close(cmp.pr);
	if (pmsg){
		compiler_setmsg(cmp, program_errormsg(cmp.prg, cmp.flpn.flp, pmsg));
		return cmp.msg;
	}

	return null;
}

static void compiler_free(compiler cmp){
	if (cmp.msg)
		mem_free(cmp.msg);
	parser_free(cmp.pr);
	symtbl_free(cmp.sym);
	filepos_node flpn = cmp.flpn;
	while (flpn){
		filepos_node del = flpn;
		flpn = flpn.next;
		flpn_free(del);
	}
	mem_free(cmp);
}

////////////////////////////////////////////////////////////////////////////////////////////////////
//
// API
//
////////////////////////////////////////////////////////////////////////////////////////////////////

//
// script API
//

sink_scr sink_scr_new(sink_inc_st inc, const char *curdir, bool repl){
	if (curdir !== NULL && curdir[0] !== '/')
		fprintf(stderr, "Warning: sink current directory \"%s\" is not an absolute path\n", curdir);
	script sc = mem_alloc(sizeof(script_st));
	sc.prg = program_new(repl);
	sc.cmp = NULL;
	sc.sinc = staticinc_new();
	sc.cup = cleanup_new();
	sc.files = list_ptr_new(mem_free_func);
	sc.paths = list_ptr_new(mem_free_func);
	sc.inc = inc;
	sc.capture_write = NULL;
	sc.curdir = curdir ? format("%s", curdir) : NULL;
	sc.file = NULL;
	sc.err = NULL;
	sc.mode = SCM_UNKNOWN;
	sc.binstate.buf = NULL;
	return sc;
}

static inline int script_addfile(script scr, const char *file){
	if (file === NULL)
		return -1;
	for (int i = 0; i < scr.files.size; i++){
		if (strcmp(scr.files.ptrs[i], file) === 0)
			return i;
	}
	list_ptr_push(scr.files, format("%s", file));
	return scr.files.size - 1;
}

static inline const char *script_getfile(script scr, int file){
	if (file < 0)
		return null;
	return scr.files.ptrs[file];
}

void sink_scr_addpath(sink_scr scr, const char *path){
	list_ptr_push(((script)scr).paths, format("%s", path));
}

void sink_scr_incbody(sink_scr scr, const char *name, const char *body){
	staticinc_addbody(((script)scr).sinc, name, body);
}

void sink_scr_incfile(sink_scr scr, const char *name, const char *file){
	staticinc_addfile(((script)scr).sinc, name, file);
}

void sink_scr_cleanup(sink_scr scr, void *cuser, sink_free_f f_free){
	cleanup_add(((script)scr).cup, cuser, f_free);
}

static bool sfr_begin(const char *file, script sc){
	if (sc.file){
		mem_free(sc.file);
		sc.file = NULL;
	}
	if (file)
		sc.file = format("%s", file);
	return true;
}

static inline void binary_validate(script sc){
	if (sc.err)
		return;
	if (sc.binstate.state === BIS_DONE){
		if (!program_validate(sc.prg))
			sc.err = format("Error: Invalid program code");
	}
	else
		sc.err = format("Error: Invalid end of file");
}

static inline void text_validate(script sc, bool close, bool resetonclose){
	if (sc.err && sc.prg.repl)
		compiler_reset(sc.cmp);
	if (close){
		char *err2 = compiler_close(sc.cmp);
		if (err2){
			if (sc.err)
				mem_free(sc.err);
			sc.err = format("Error: %s", err2);
		}
		if (resetonclose)
			compiler_reset(sc.cmp);
	}
}

static void sfr_end(bool success, const char *file, script sc){
	if (!success){
		if (sc.err)
			mem_free(sc.err);
		sc.err = format("Error: %s", sc.cmp.msg);
	}
	else{
		switch (sc.mode){
			case SCM_UNKNOWN:
				// empty file, do nothing
				break;
			case SCM_BINARY:
				binary_validate(sc);
				break;
			case SCM_TEXT:
				text_validate(sc, true, false);
				break;
		}
	}
}

bool sink_scr_loadfile(sink_scr scr, const char *file){
	script sc = scr;
	if (sc.err){
		mem_free(sc.err);
		sc.err = NULL;
	}
	bool read = fileres_read(sc, true, file, NULL,
		(f_fileres_begin_f)sfr_begin, (f_fileres_end_f)sfr_end, sc);
	if (!read && sc.err === NULL)
		sc.err = format("Error: Failed to read file: %s", file);
	return sc.err === NULL;
}

const char *sink_scr_getfile(sink_scr scr){
	return ((script)scr).file;
}

const char *sink_scr_getcwd(sink_scr scr){
	return ((script)scr).curdir;
}

// byte size of each section of the binary file
static const int BSZ_HEADER     = 28;
static const int BSZ_STR_HEAD   =  4;
static const int BSZ_KEY        =  8;
static const int BSZ_DEBUG_HEAD =  4;
static const int BSZ_POS        = 16;
static const int BSZ_CMD        =  8;

bool sink_scr_write(sink_scr scr, int size, const uint8_t *bytes){
	if (size <= 0)
		return true;
	script sc = scr;

	if (sc.capture_write){
		// the write operation is being captured by an embed, so append to the list_byte, and
		// return immediately
		list_byte_append(sc.capture_write, size, bytes);
		return true;
	}

	// sink binary files start with 0xFC (invalid UTF8 start byte), so we can tell if we're binary
	// just by looking at the first byte
	if (sc.mode === SCM_UNKNOWN){
		if (bytes[0] === 0xFC){
			sc.mode = SCM_BINARY;
			sc.binstate.state = BIS_HEADER;
			sc.binstate.left = BSZ_HEADER;
			sc.binstate.buf = list_byte_new();
		}
		else{
			sc.mode = SCM_TEXT;
			sc.cmp = compiler_new(sc, sc.prg, sc.sinc, sc.inc, sc.file, sc.paths);
		}
	}

	if (sc.mode === SCM_BINARY){
		if (sc.err){
			mem_free(sc.err);
			sc.err = NULL;
		}

		binstate_st *bs = &sc.binstate;
		program prg = sc.prg;

		// read a 4 byte integer (LE)
		#define GETINT(i)    (                               \
			(((uint32_t)bs.buf.bytes[(i) + 0])      ) |    \
			(((uint32_t)bs.buf.bytes[(i) + 1]) <<  8) |    \
			(((uint32_t)bs.buf.bytes[(i) + 2]) << 16) |    \
			(((uint32_t)bs.buf.bytes[(i) + 3]) << 24))

		// write to the buffer up to a certain total bytes (bs.left)
		#define WRITE()                                      \
			if (size > bs.left){                            \
				/* partial write to buf * /                   \
				list_byte_append(bs.buf, bs.left, bytes);  \
				bytes += bs.left;                           \
				size -= bs.left;                            \
				bs.left = 0;                                \
			}                                                \
			else{                                            \
				/* full write to buf * /                      \
				list_byte_append(bs.buf, size, bytes);      \
				bs.left -= size;                            \
				size = 0;                                    \
			}

		while (size > 0){
			switch (bs.state){
				case BIS_HEADER:
					WRITE()
					if (bs.left === 0){
						// finished reading entire header
						uint32_t magic = GETINT(0);
						bs.str_size = GETINT(4);
						bs.key_size = GETINT(8);
						bs.dbg_size = GETINT(12);
						bs.pos_size = GETINT(16);
						bs.cmd_size = GETINT(20);
						bs.ops_size = GETINT(24);
						if (magic !== 0x016B53FC){
							sc.err = format("Error: Invalid binary header");
							return false;
						}
						debugf("binary header: strs %d, keys %d, dbgs %d, poss %d, cmds %d, ops %d",
							bs.str_size, bs.key_size, bs.dbg_size, bs.pos_size,
							bs.cmd_size, bs.ops_size);
						bs.state = BIS_STR_HEAD;
						bs.left = BSZ_STR_HEAD;
						bs.item = 0;
						bs.buf.size = 0;
					}
					break;
				case BIS_STR_HEAD:
					if (bs.item >= bs.str_size){
						bs.state = BIS_KEY;
						bs.left = BSZ_KEY;
						bs.item = 0;
						break;
					}
					WRITE()
					if (bs.left === 0){
						bs.state = BIS_STR_BODY;
						bs.left = GETINT(0);
						bs.buf.size = 0;
					}
					break;
				case BIS_STR_BODY: // variable
					WRITE()
					if (bs.left === 0){
						list_byte_null(bs.buf);
						debugf("str[%d] = \"%s\"", bs.item, (const char *)bs.buf.bytes);
						list_ptr_push(prg.strTable, bs.buf);
						bs.buf = list_byte_new();
						bs.state = BIS_STR_HEAD;
						bs.left = BSZ_STR_HEAD;
						bs.item++;
					}
					break;
				case BIS_KEY:
					if (bs.item >= bs.key_size){
						bs.state = BIS_DEBUG_HEAD;
						bs.left = BSZ_DEBUG_HEAD;
						bs.item = 0;
						break;
					}
					WRITE()
					if (bs.left === 0){
						uint64_t key =
							(((uint64_t)bs.buf.bytes[0])      ) |
							(((uint64_t)bs.buf.bytes[1]) <<  8) |
							(((uint64_t)bs.buf.bytes[2]) << 16) |
							(((uint64_t)bs.buf.bytes[3]) << 24) |
							(((uint64_t)bs.buf.bytes[4]) << 32) |
							(((uint64_t)bs.buf.bytes[5]) << 40) |
							(((uint64_t)bs.buf.bytes[6]) << 48) |
							(((uint64_t)bs.buf.bytes[7]) << 56);
						list_u64_push(prg.keyTable, key);
						debugf("key[%d] = %016llX", bs.item, key);
						bs.item++;
						bs.left = BSZ_KEY;
						bs.buf.size = 0;
					}
					break;
				case BIS_DEBUG_HEAD:
					if (bs.item >= bs.dbg_size){
						bs.state = BIS_POS;
						bs.left = BSZ_POS;
						bs.item = 0;
						break;
					}
					WRITE()
					if (bs.left === 0){
						bs.state = BIS_DEBUG_BODY;
						bs.left = GETINT(0);
						bs.buf.size = 0;
					}
					break;
				case BIS_DEBUG_BODY: // variable
					WRITE()
					if (bs.left === 0){
						list_byte_null(bs.buf);
						debugf("dbg[%d] = \"%s\"", bs.item, (const char *)bs.buf.bytes);
						list_ptr_push(prg.debugTable, list_byte_freetochar(bs.buf));
						bs.buf = list_byte_new();
						bs.state = BIS_DEBUG_HEAD;
						bs.left = BSZ_DEBUG_HEAD;
						bs.item++;
					}
					break;
				case BIS_POS:
					if (bs.item >= bs.pos_size){
						bs.state = BIS_CMD;
						bs.left = BSZ_CMD;
						bs.item = 0;
						break;
					}
					WRITE()
					if (bs.left === 0){
						prgflp p = mem_alloc(sizeof(prgflp_st));
						p.pc           = GETINT( 0);
						p.flp.line     = GETINT( 4);
						p.flp.chr      = GETINT( 8);
						p.flp.basefile = GETINT(12);
						p.flp.fullfile = -1;
						debugf("pos[%d] = pc %d, line %d, chr %d, bsf %d", bs.item,
							p.pc, p.flp.line, p.flp.chr, p.flp.basefile);
						list_ptr_push(prg.posTable, p);
						bs.buf.size = 0;
						bs.left = BSZ_POS;
						bs.item++;
						// silently validate basefile
						if (p.flp.basefile >= bs.dbg_size)
							p.flp.basefile = -1;
					}
					break;
				case BIS_CMD:
					if (bs.item >= bs.cmd_size){
						bs.state = BIS_OPS;
						bs.left = bs.ops_size + 1; // add 1 to read the terminating byte
						break;
					}
					WRITE()
					if (bs.left === 0){
						prgch p = mem_alloc(sizeof(prgch_st));
						p.pc      = GETINT(0);
						p.cmdhint = GETINT(4);
						debugf("cmd[%d] = pc %d, cmh %d", bs.item, p.pc, p.cmdhint);
						list_ptr_push(prg.cmdTable, p);
						bs.buf.size = 0;
						bs.left = BSZ_CMD;
						bs.item++;
						// silently validate cmdhint
						if (p.cmdhint >= bs.dbg_size)
							p.cmdhint = -1;
					}
					break;
				case BIS_OPS: // variable
					WRITE()
					if (bs.left === 0){
						// validate terminating byte
						if (bs.buf.bytes[bs.buf.size - 1] !== 0xFD){
							sc.err = format("Error: Invalid binary file");
							return false;
						}
						bs.buf.size--; // trim off terminating byte
						list_byte_free(prg.ops);
						prg.ops = bs.buf;
						bs.buf = NULL;
						bs.state = BIS_DONE;
					}
					break;
				case BIS_DONE:
					sc.err = format("Error: Invalid data at end of file");
					return false;
			}
		}
		#undef GETINT
		#undef WRITE
		bool is_eval = !sc.prg.repl && sc.file === NULL;
		if (is_eval) // if we're evaling, then we're at the end of file right now
			binary_validate(sc);
		return sc.err === NULL;
	}
	else{
		if (sc.err){
			mem_free(sc.err);
			sc.err = NULL;
		}
		char *err = compiler_write(sc.cmp, size, bytes);
		if (err)
			sc.err = format("Error: %s", err);
		bool is_eval = !sc.prg.repl && sc.file === NULL;
		text_validate(sc, is_eval, true);
		return sc.err === NULL;
	}
}

const char *sink_scr_geterr(sink_scr scr){
	return ((script)scr).err;
}

int sink_scr_level(sink_scr scr){
	if (((script)scr).mode !== SCM_TEXT)
		return 0;
	return ((script)scr).cmp.pr.level;
}

void sink_scr_dump(sink_scr scr, bool debug, void *user, sink_dump_f f_dump){
	// all integer values are little endian

	program prg = ((script)scr).prg;

	// output header
	// 4 bytes: header: 0xFC, 'S', 'k', file format version (always 0x01)
	// 4 bytes: string table size
	// 4 bytes: key table size
	// 4 bytes: debug string table size
	// 4 bytes: pos table size
	// 4 bytes: cmd table size
	// 4 bytes: opcode size
	uint8_t header[28] = {0};
	header[ 0] = 0xFC;
	header[ 1] = 0x53;
	header[ 2] = 0x6B;
	header[ 3] = 0x01;
	header[ 4] = (prg.strTable.size            ) & 0xFF;
	header[ 5] = (prg.strTable.size       >>  8) & 0xFF;
	header[ 6] = (prg.strTable.size       >> 16) & 0xFF;
	header[ 7] = (prg.strTable.size       >> 24) & 0xFF;
	header[ 8] = (prg.keyTable.size            ) & 0xFF;
	header[ 9] = (prg.keyTable.size       >>  8) & 0xFF;
	header[10] = (prg.keyTable.size       >> 16) & 0xFF;
	header[11] = (prg.keyTable.size       >> 24) & 0xFF;
	if (debug){
		header[12] = (prg.debugTable.size      ) & 0xFF;
		header[13] = (prg.debugTable.size >>  8) & 0xFF;
		header[14] = (prg.debugTable.size >> 16) & 0xFF;
		header[15] = (prg.debugTable.size >> 24) & 0xFF;
		header[16] = (prg.posTable.size        ) & 0xFF;
		header[17] = (prg.posTable.size   >>  8) & 0xFF;
		header[18] = (prg.posTable.size   >> 16) & 0xFF;
		header[19] = (prg.posTable.size   >> 24) & 0xFF;
		header[20] = (prg.cmdTable.size        ) & 0xFF;
		header[21] = (prg.cmdTable.size   >>  8) & 0xFF;
		header[22] = (prg.cmdTable.size   >> 16) & 0xFF;
		header[23] = (prg.cmdTable.size   >> 24) & 0xFF;
	}
	header[24] = (prg.ops.size                 ) & 0xFF;
	header[25] = (prg.ops.size            >>  8) & 0xFF;
	header[26] = (prg.ops.size            >> 16) & 0xFF;
	header[27] = (prg.ops.size            >> 24) & 0xFF;
	f_dump(header, 1, 28, user);

	// output strTable
	// 4 bytes: string size
	// N bytes: raw string bytes
	for (int i = 0; i < prg.strTable.size; i++){
		list_byte str = prg.strTable.ptrs[i];
		uint8_t sizeb[4] = {
			(str.size      ) & 0xFF,
			(str.size >>  8) & 0xFF,
			(str.size >> 16) & 0xFF,
			(str.size >> 24) & 0xFF
		};
		f_dump(sizeb, 1, 4, user);
		if (str.size > 0)
			f_dump(str.bytes, 1, str.size, user);
	}

	// output keyTable
	// 8 bytes: hash identifier
	for (int i = 0; i < prg.keyTable.size; i++){
		uint64_t id = prg.keyTable.vals[i];
		uint8_t idb[8] = {
			(id      ) & 0xFF,
			(id >>  8) & 0xFF,
			(id >> 16) & 0xFF,
			(id >> 24) & 0xFF,
			(id >> 32) & 0xFF,
			(id >> 40) & 0xFF,
			(id >> 48) & 0xFF,
			(id >> 56) & 0xFF
		};
		f_dump(idb, 1, 8, user);
	}

	if (debug){
		// output debug strings
		// 4 bytes: string length
		// N bytes: string raw bytes
		for (int i = 0; i < prg.debugTable.size; i++){
			char *str = prg.debugTable.ptrs[i];
			size_t slen = str === NULL ? 4 : strlen(str);
			uint8_t slenb[4] = {
				(slen      ) & 0xFF,
				(slen >>  8) & 0xFF,
				(slen >> 16) & 0xFF,
				(slen >> 24) & 0xFF
			};
			f_dump(slenb, 1, 4, user);
			if (str === NULL)
				f_dump("eval", 1, 4, user);
			else if (slen > 0)
				f_dump(str, 1, slen, user);
		}

		// output pos table
		// 4 bytes: start PC
		// 4 bytes: line number
		// 4 bytes: character number
		// 4 bytes: filename debug string index
		for (int i = 0; i < prg.posTable.size; i++){
			prgflp p = prg.posTable.ptrs[i];
			// find unique filename entry
			uint8_t plcb[16] = {
				(p.pc                ) & 0xFF,
				(p.pc           >>  8) & 0xFF,
				(p.pc           >> 16) & 0xFF,
				(p.pc           >> 24) & 0xFF,
				(p.flp.line          ) & 0xFF,
				(p.flp.line     >>  8) & 0xFF,
				(p.flp.line     >> 16) & 0xFF,
				(p.flp.line     >> 24) & 0xFF,
				(p.flp.chr           ) & 0xFF,
				(p.flp.chr      >>  8) & 0xFF,
				(p.flp.chr      >> 16) & 0xFF,
				(p.flp.chr      >> 24) & 0xFF,
				(p.flp.basefile      ) & 0xFF,
				(p.flp.basefile >>  8) & 0xFF,
				(p.flp.basefile >> 16) & 0xFF,
				(p.flp.basefile >> 24) & 0xFF
			};
			f_dump(plcb, 1, 16, user);
		}

		// output cmd table
		// 4 bytes: return PC
		// 4 bytes: hint debug string index
		for (int i = 0; i < prg.cmdTable.size; i++){
			prgch p = prg.cmdTable.ptrs[i];
			uint8_t plcb[8] = {
				(p.pc            ) & 0xFF,
				(p.pc       >>  8) & 0xFF,
				(p.pc       >> 16) & 0xFF,
				(p.pc       >> 24) & 0xFF,
				(p.cmdhint       ) & 0xFF,
				(p.cmdhint  >>  8) & 0xFF,
				(p.cmdhint  >> 16) & 0xFF,
				(p.cmdhint  >> 24) & 0xFF
			};
			f_dump(plcb, 1, 8, user);
		}
	}

	// output ops
	// just the raw bytecode
	if (prg.ops.size > 0)
		f_dump(prg.ops.bytes, 1, prg.ops.size, user);

	// output terminating byte
	// single 0xFD byte which is an invalid op
	uint8_t end = 0xFD;
	f_dump(&end, 1, 1, user);
}

void sink_scr_free(sink_scr scr){
	script sc = scr;
	list_ptr_free(sc.files);
	list_ptr_free(sc.paths);
	program_free(sc.prg);
	staticinc_free(sc.sinc);
	cleanup_free(sc.cup);
	if (sc.cmp)
		compiler_free(sc.cmp);
	if (sc.capture_write)
		list_byte_free(sc.capture_write);
	if (sc.curdir)
		mem_free(sc.curdir);
	if (sc.file)
		mem_free(sc.file);
	if (sc.err)
		mem_free(sc.err);
	if (sc.binstate.buf)
		list_byte_free(sc.binstate.buf);
	mem_free(sc);
	mem_done();
}

//
// context API
//

sink_ctx sink_ctx_new(sink_scr scr, sink_io_st io){
	return context_new(((script)scr).prg, io);
}

sink_ctx_status sink_ctx_getstatus(sink_ctx ctx){
	context ctx2 = ctx;
	if (ctx2.passed)
		return SINK_CTX_PASSED;
	else if (ctx2.failed)
		return SINK_CTX_FAILED;
	else if (ctx2.async)
		return SINK_CTX_WAITING;
	return SINK_CTX_READY;
}

void sink_ctx_native(sink_ctx ctx, const char *name, void *natuser, sink_native_f f_native){
	context_native(ctx, native_hash((int)strlen(name), (const uint8_t *)name), natuser, f_native);
}

void sink_ctx_nativehash(sink_ctx ctx, uint64_t hash, void *natuser, sink_native_f f_native){
	context_native(ctx, hash, natuser, f_native);
}

void sink_ctx_cleanup(sink_ctx ctx, void *cuser, sink_free_f f_cleanup){
	context_cleanup(ctx, cuser, f_cleanup);
}

void sink_ctx_setuser(sink_ctx ctx, void *user, sink_free_f f_freeuser){
	context ctx2 = ctx;
	if (ctx2.f_freeuser)
		ctx2.f_freeuser(ctx2.user);
	ctx2.user = user;
	ctx2.f_freeuser = f_freeuser;
}

void *sink_ctx_getuser(sink_ctx ctx){
	return ((context)ctx).user;
}

sink_user sink_ctx_addusertype(sink_ctx ctx, const char *hint, sink_free_f f_free){
	context ctx2 = ctx;
	list_ptr_push(ctx2.f_finalize, f_free);
	list_ptr_push(ctx2.user_hint, (void *)hint);
	return ctx2.f_finalize.size - 1;
}

sink_free_f sink_ctx_getuserfree(sink_ctx ctx, sink_user usertype){
	return ((context)ctx).f_finalize.ptrs[usertype];
}

const char *sink_ctx_getuserhint(sink_ctx ctx, sink_user usertype){
	return ((context)ctx).user_hint.ptrs[usertype];
}

void sink_ctx_asyncresult(sink_ctx ctx, sink_val v){
	context ctx2 = ctx;
	if (!ctx2.async){
		assert(false);
		return;
	}
	var_set(ctx2, ctx2.async_frame, ctx2.async_index, v);
	ctx2.async = false;
}

void sink_ctx_settimeout(sink_ctx ctx, int timeout){
	context ctx2 = ctx;
	ctx2.timeout = timeout;
	ctx2.timeout_left = timeout;
}

int sink_ctx_gettimeout(sink_ctx ctx){
	return ((context)ctx).timeout;
}

void sink_ctx_forcetimeout(sink_ctx ctx){
	((context)ctx).timeout_left = 0;
}

sink_run sink_ctx_run(sink_ctx ctx){
	context ctx2 = ctx;
	if (ctx2.prg.repl && ctx2.err){
		mem_free(ctx2.err);
		ctx2.err = NULL;
	}
	sink_run r = context_run(ctx2);
	if (r === SINK_RUN_PASS || r === SINK_RUN_FAIL)
		context_reset(ctx2);
	return r;
}

const char *sink_ctx_geterr(sink_ctx ctx){
	return ((context)ctx).err;
}

bool sink_arg_bool(int size, sink_val *args, int index){
	if (index < 0 || index >= size)
		return false;
	return sink_istrue(args[index]);
}

bool sink_arg_num(sink_ctx ctx, int size, sink_val *args, int index, double *num){
	if (index < 0 || index >= size){
		*num = 0;
		return true;
	}
	if (sink_isnum(args[index])){
		*num = args[index].f;
		return true;
	}
	opi_abortformat(ctx, "Expecting number for argument %d", index + 1);
	return false;
}

bool sink_arg_str(sink_ctx ctx, int size, sink_val *args, int index, sink_str *str){
	if (index < 0 || index >= size || !sink_isstr(args[index])){
		opi_abortformat(ctx, "Expecting string for argument %d", index + 1);
		return false;
	}
	*str = var_caststr(ctx, args[index]);
	return true;
}

bool sink_arg_list(sink_ctx ctx, int size, sink_val *args, int index, sink_list *ls){
	if (index < 0 || index >= size || !sink_islist(args[index])){
		opi_abortformat(ctx, "Expecting list for argument %d", index + 1);
		*ls = NULL;
		return false;
	}
	*ls = sink_castlist(ctx, args[index]);
	return true;
}

bool sink_arg_user(sink_ctx ctx, int size, sink_val *args, int index, sink_user usertype,
	void **user){
	context ctx2 = ctx;
	const char *hint = ctx2.user_hint.ptrs[usertype];

	#define ABORT() \
		opi_abortformat(ctx, "Expecting user type%s%s for argument %d", \
			hint === NULL ? "" : " ", hint === NULL ? "" : hint, index + 1)

	if (index < 0 || index >= size || !sink_islist(args[index])){
		ABORT();
		return false;
	}
	*user = sink_list_getuser(ctx, args[index], usertype);
	if (user === NULL){
		ABORT();
		return false;
	}

	#undef ABORT

	return true;
}
*/
function sinkhelp_tostr(li: sink_val[], v: sink_val): sink_str {
	if (v === null)
		return 'nil';
	else if (typeof v === 'number'){
		if (v === Infinity)
			return 'inf';
		else if (v === -Infinity)
			return '-inf';
		return numtostr(v);
	}
	else if (typeof v === 'string')
		return '\'' + v.replace(/\//g, '\\\\').replace(/'/g, '\\\'') + '\'';
	else{ // v is a list
		if (li.indexOf(v) >= 0)
			return '{circular}';
		let ret: string = '';
		li.push(v);
		for (let i = 0; i < v.length; i++)
			ret += (i === 0 ? '' : ', ') + sinkhelp_tostr(li, v[i]);
		li.pop();
		return '{' + ret + '}';
	}
}

export function sink_tostr(v: sink_val): sink_str {
	if (sink_isstr(v))
		return v;
	return sinkhelp_tostr([], v);
}
/*
void sink_exit(sink_ctx ctx, int size, sink_val *vals){
	if (size > 0)
		sink_say(ctx, size, vals);
	opi_exit(ctx);
}

void sink_abort(sink_ctx ctx, int size, sink_val *vals){
	uint8_t *bytes = NULL;
	if (size > 0){
		int tot;
		bytes = sink_list_joinplain(size, vals, 1, (const uint8_t *)" ", &tot);
	}
	opi_abort(ctx, (char *)bytes);
}

// numbers
sink_val sink_num_neg(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_neg, txt_num_neg);
}

sink_val sink_num_add(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_add, txt_num_add, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_num_sub(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_sub, txt_num_sub, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_num_mul(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_mul, txt_num_mul, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_num_div(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_div, txt_num_div, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_num_mod(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_mod, txt_num_mod, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_num_pow(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_pow, txt_num_pow, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_num_abs(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_abs, txt_num_abs);
}

sink_val sink_num_sign(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_sign, txt_num_sign);
}

sink_val sink_num_max(sink_ctx ctx, int size, sink_val *vals){
	return opi_num_max(ctx, size, vals);
}

sink_val sink_num_min(sink_ctx ctx, int size, sink_val *vals){
	return opi_num_min(ctx, size, vals);
}

sink_val sink_num_clamp(sink_ctx ctx, sink_val a, sink_val b, sink_val c){
	return opi_triop(ctx, a, b, c, triop_num_clamp, txt_num_clamp);
}

sink_val sink_num_floor(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_floor, txt_num_floor);
}

sink_val sink_num_ceil(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_ceil, txt_num_ceil);
}

sink_val sink_num_round(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_round, txt_num_round);
}

sink_val sink_num_trunc(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_trunc, txt_num_trunc);
}

sink_val sink_num_sin(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_sin, txt_num_sin);
}

sink_val sink_num_cos(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_cos, txt_num_cos);
}

sink_val sink_num_tan(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_tan, txt_num_tan);
}

sink_val sink_num_asin(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_asin, txt_num_asin);
}

sink_val sink_num_acos(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_acos, txt_num_acos);
}

sink_val sink_num_atan(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_atan, txt_num_atan);
}

sink_val sink_num_atan2(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_atan2, txt_num_atan, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_num_log(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_log, txt_num_log);
}

sink_val sink_num_log2(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_log2, txt_num_log);
}

sink_val sink_num_log10(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_log10, txt_num_log);
}

sink_val sink_num_exp(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_num_exp, txt_num_pow);
}

sink_val sink_num_lerp(sink_ctx ctx, sink_val a, sink_val b, sink_val t){
	return opi_triop(ctx, a, b, t, triop_num_lerp, txt_num_lerp);
}

sink_val sink_num_hex(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_hex, txt_num_hex, LT_ALLOWNUM, LT_ALLOWNUM | LT_ALLOWNIL);
}

sink_val sink_num_oct(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_oct, txt_num_oct, LT_ALLOWNUM, LT_ALLOWNUM | LT_ALLOWNIL);
}

sink_val sink_num_bin(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_num_bin, txt_num_bin, LT_ALLOWNUM, LT_ALLOWNUM | LT_ALLOWNIL);
}

// integers
sink_val sink_int_new(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_int_new, txt_int_new);
}

sink_val sink_int_not(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_int_not, txt_int_not);
}

sink_val sink_int_and(sink_ctx ctx, int size, sink_val *vals){
	return opi_combop(ctx, size, vals, binop_int_and, txt_int_and);
}

sink_val sink_int_or(sink_ctx ctx, int size, sink_val *vals){
	return opi_combop(ctx, size, vals, binop_int_or, txt_int_or);
}

sink_val sink_int_xor(sink_ctx ctx, int size, sink_val *vals){
	return opi_combop(ctx, size, vals, binop_int_xor, txt_int_xor);
}

sink_val sink_int_shl(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_int_shl, txt_int_shl, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_int_shr(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_int_shr, txt_int_shr, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_int_sar(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_int_sar, txt_int_shr, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_int_add(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_int_add, txt_num_add, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_int_sub(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_int_sub, txt_num_sub, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_int_mul(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_int_mul, txt_num_mul, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_int_div(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_int_div, txt_num_div, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_int_mod(sink_ctx ctx, sink_val a, sink_val b){
	return opi_binop(ctx, a, b, binop_int_mod, txt_num_mod, LT_ALLOWNUM, LT_ALLOWNUM);
}

sink_val sink_int_clz(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_int_clz, txt_int_clz);
}

sink_val sink_int_pop(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_int_pop, txt_int_pop);
}

sink_val sink_int_bswap(sink_ctx ctx, sink_val a){
	return opi_unop(ctx, a, unop_int_bswap, txt_int_bswap);
}

// strings
sink_val sink_str_newcstr(sink_ctx ctx, const char *str){
	return sink_str_newblob(ctx, (int)strlen(str), (const uint8_t *)str);
}

sink_val sink_str_newcstrgive(sink_ctx ctx, char *str){
	return sink_str_newblobgive(ctx, (int)strlen(str), (uint8_t *)str);
}

sink_val sink_str_newblob(sink_ctx ctx, int size, const uint8_t *bytes){
	uint8_t *copy = NULL;
	if (size > 0){
		copy = mem_alloc(sizeof(uint8_t) * (size + 1));
		memcpy(copy, bytes, sizeof(uint8_t) * size);
		copy[size] = 0;
	}
	return sink_str_newblobgive(ctx, size, copy);
}

sink_val sink_str_newblobgive(sink_ctx ctx, int size, uint8_t *bytes){
	if (!((bytes === NULL && size === 0) || bytes[size] === 0)){
		opi_abort(ctx,
			"Native run-time error: sink_str_newblobgive() must either be given a NULL buffer of "
			"size 0, or the buffer must terminate with a 0");
		if (bytes)
			mem_free(bytes);
		return SINK_NIL;
	}
	context ctx2 = ctx;
	int index = bmp_reserve((void **)&ctx2.str_tbl, &ctx2.str_size, &ctx2.str_aloc,
		&ctx2.str_ref, sizeof(sink_str_st));
	sink_str s = &ctx2.str_tbl[index];
	s.bytes = bytes;
	s.size = size;
	return (sink_val){ .u = SINK_TAG_STR | index };
}

sink_val sink_str_newformat(sink_ctx ctx, const char *fmt, ...){
	va_list args, args2;
	va_start(args, fmt);
	va_copy(args2, args);
	size_t s = vsnprintf(NULL, 0, fmt, args);
	char *buf = mem_alloc(s + 1);
	vsprintf(buf, fmt, args2);
	va_end(args);
	va_end(args2);
	return sink_str_newblobgive(ctx, (int)s, (uint8_t *)buf);
}
*/
export function sink_str_hashplain(str: string, seed: number): [number, number, number, number] {
	// MurmurHash3 was written by Austin Appleby, and is placed in the public
	// domain. The author hereby disclaims copyright to this source code.
	// https://github.com/aappleby/smhasher

	// 64-bit operations store numbers as [low int32_t, high int32_t]

	function x64_add(a: sink_u64, b: sink_u64): sink_u64 {
		let A0 = a[0] & 0xFFFF; // lowest 16 bits
		let A1 = a[0] >>> 16;   // ...
		let A2 = a[1] & 0xFFFF; // ...
		let A3 = a[1] >>> 16;   // highest 16 bits
		let B0 = b[0] & 0xFFFF;
		let B1 = b[0] >>> 16;
		let B2 = b[1] & 0xFFFF;
		let B3 = b[1] >>> 16;
		let R0 = A0 + B0;
		let R1 = A1 + B1 + (R0 >> 16);
		let R2 = A2 + B2 + (R1 >> 16);
		let R3 = A3 + B3 + (R2 >> 16);
		return [(R0 & 0xFFFF) | ((R1 & 0xFFFF) << 16), (R2 & 0xFFFF) | ((R3 & 0xFFFF) << 16)];
	}

	function x64_mul(a: sink_u64, b: sink_u64): sink_u64 {
		var A0 = a[0] & 0xFFFF; // lowest 16 bits
		var A1 = a[0] >>> 16;   // ...
		var A2 = a[1] & 0xFFFF; // ...
		var A3 = a[1] >>> 16;   // highest 16 bits
		var B0 = b[0] & 0xFFFF;
		var B1 = b[0] >>> 16;
		var B2 = b[1] & 0xFFFF;
		var B3 = b[1] >>> 16;
		var T;
		var R0, R1, R2, R3;
		T = A0 * B0             ; R0  = T & 0xFFFF;
		T = A1 * B0 + (T >>> 16); R1  = T & 0xFFFF;
		T = A2 * B0 + (T >>> 16); R2  = T & 0xFFFF;
		T = A3 * B0 + (T >>> 16); R3  = T & 0xFFFF;
		T = A0 * B1             ; R1 += T & 0xFFFF;
		T = A1 * B1 + (T >>> 16); R2 += T & 0xFFFF;
		T = A2 * B1 + (T >>> 16); R3 += T & 0xFFFF;
		T = A0 * B2             ; R2 += T & 0xFFFF;
		T = A1 * B2 + (T >>> 16); R3 += T & 0xFFFF;
		T = A0 * B3             ; R3 += T & 0xFFFF;
		R1 += R0 >>> 16;
		R2 += R1 >>> 16;
		R3 += R2 >>> 16;
		return [(R0 & 0xFFFF) | ((R1 & 0xFFFF) << 16), (R2 & 0xFFFF) | ((R3 & 0xFFFF) << 16)];
	}

	function x64_rotl(a: sink_u64, b: number): sink_u64 {
		b %= 64;
		if (b == 0)
			return a;
		else if (b == 32)
			return [a[1], a[0]];
		else if (b < 32)
			return [(a[0] << b) | (a[1] >>> (32 - b)), (a[1] << b) | (a[0] >>> (32 - b))];
		b -= 32;
		return [(a[1] << b) | (a[0] >>> (32 - b)), (a[0] << b) | (a[1] >>> (32 - b))];
	}

	function x64_shl(a: sink_u64, b: number): sink_u64 {
		if (b <= 0)
			return a;
		else if (b >= 64)
			return [0, 0];
		else if (b >= 32)
			return [0, a[0] << (b - 32)];
		return [a[0] << b, (a[1] << b) | (a[0] >>> (32 - b))];
	}

	function x64_shr(a: sink_u64, b: number): sink_u64 {
		if (b <= 0)
			return a;
		else if (b >= 64)
			return [0, 0];
		else if (b >= 32)
			return [a[1] >>> (b - 32), 0];
		return [(a[0] >>> b) | (a[1] << (32 - b)), a[1] >>> b];
	}

	function x64_xor(a: sink_u64, b: sink_u64): sink_u64 {
		return [a[0] ^ b[0], a[1] ^ b[1]];
	}

	function x64_fmix(a: sink_u64): sink_u64 {
		a = x64_xor(a, x64_shr(a, 33));
		a = x64_mul(a, [0xED558CCD, 0xFF51AFD7]);
		a = x64_xor(a, x64_shr(a, 33));
		a = x64_mul(a, [0x1A85EC53, 0xC4CEB9FE]);
		a = x64_xor(a, x64_shr(a, 33));
		return a;
	}

	function getblock(i: number): sink_u64 {
		return [
			(str.charCodeAt(i + 0)      ) |
			(str.charCodeAt(i + 1) <<  8) |
			(str.charCodeAt(i + 2) << 16) |
			(str.charCodeAt(i + 3) << 24),
			(str.charCodeAt(i + 4)      ) |
			(str.charCodeAt(i + 5) <<  8) |
			(str.charCodeAt(i + 6) << 16) |
			(str.charCodeAt(i + 7) << 24)
		];
	}

	// hash code

	let nblocks = str.length >>> 4;
	let h1: sink_u64 = [seed, 0];
	let h2: sink_u64 = [seed, 0];
	let c1: sink_u64 = [0x114253D5, 0x87C37B91];
	let c2: sink_u64 = [0x2745937F, 0x4CF5AD43];
	for (let i = 0; i < nblocks; i++){
		let k1 = getblock((i * 2 + 0) * 8);
		let k2 = getblock((i * 2 + 1) * 8);

		k1 = x64_mul(k1, c1);
		k1 = x64_rotl(k1, 31);
		k1 = x64_mul(k1, c2);
		h1 = x64_xor(h1, k1);

		h1 = x64_rotl(h1, 27);
		h1 = x64_add(h1, h2);
		h1 = x64_add(x64_mul(h1, [5, 0]), [0x52DCE729, 0]);

		k2 = x64_mul(k2, c2);
		k2 = x64_rotl(k2, 33);
		k2 = x64_mul(k2, c1);
		h2 = x64_xor(h2, k2);

		h2 = x64_rotl(h2, 31);
		h2 = x64_add(h2, h1);
		h2 = x64_add(x64_mul(h2, [5, 0]), [0x38495AB5, 0]);
	}

	let k1: sink_u64 = [0, 0];
	let k2: sink_u64 = [0, 0];
	var tail = str.substr(nblocks << 4);

	switch(tail.length) {
		case 15: k2 = x64_xor(k2, x64_shl([tail.charCodeAt(14), 0], 48));
		case 14: k2 = x64_xor(k2, x64_shl([tail.charCodeAt(13), 0], 40));
		case 13: k2 = x64_xor(k2, x64_shl([tail.charCodeAt(12), 0], 32));
		case 12: k2 = x64_xor(k2, x64_shl([tail.charCodeAt(11), 0], 24));
		case 11: k2 = x64_xor(k2, x64_shl([tail.charCodeAt(10), 0], 16));
		case 10: k2 = x64_xor(k2, x64_shl([tail.charCodeAt( 9), 0],  8));
		case  9: k2 = x64_xor(k2,         [tail.charCodeAt( 8), 0]     );

			k2 = x64_mul(k2, c2);
			k2 = x64_rotl(k2, 33);
			k2 = x64_mul(k2, c1);
			h2 = x64_xor(h2, k2);

		case  8: k1 = x64_xor(k1, x64_shl([tail.charCodeAt( 7), 0], 56));
		case  7: k1 = x64_xor(k1, x64_shl([tail.charCodeAt( 6), 0], 48));
		case  6: k1 = x64_xor(k1, x64_shl([tail.charCodeAt( 5), 0], 40));
		case  5: k1 = x64_xor(k1, x64_shl([tail.charCodeAt( 4), 0], 32));
		case  4: k1 = x64_xor(k1, x64_shl([tail.charCodeAt( 3), 0], 24));
		case  3: k1 = x64_xor(k1, x64_shl([tail.charCodeAt( 2), 0], 16));
		case  2: k1 = x64_xor(k1, x64_shl([tail.charCodeAt( 1), 0],  8));
		case  1: k1 = x64_xor(k1,         [tail.charCodeAt( 0), 0]     );

			k1 = x64_mul(k1, c1);
			k1 = x64_rotl(k1, 31);
			k1 = x64_mul(k1, c2);
			h1 = x64_xor(h1, k1);
	}

	h1 = x64_xor(h1, [str.length, 0]);
	h2 = x64_xor(h2, [str.length, 0]);

	h1 = x64_add(h1, h2);
	h2 = x64_add(h2, h1);

	h1 = x64_fmix(h1);
	h2 = x64_fmix(h2);

	h1 = x64_add(h1, h2);
	h2 = x64_add(h2, h1);

	// make number unsigned
	function uns(n: number): number {
		return (n < 0 ? 4294967296 : 0) + n;
	}
	return [uns(h1[0]), uns(h1[1]), uns(h2[0]), uns(h2[1])];
}
/*
// lists
void sink_list_setuser(sink_ctx ctx, sink_val ls, sink_user usertype, void *user){
	sink_list ls2 = var_castlist(ctx, ls);
	if (ls2.usertype >= 0){
		sink_free_f f_free = ((context)ctx).f_finalize.ptrs[ls2.usertype];
		if (f_free)
			f_free(ls2.user);
	}
	ls2.usertype = usertype;
	ls2.user = user;
}

void *sink_list_getuser(sink_ctx ctx, sink_val ls, sink_user usertype){
	sink_list ls2 = var_castlist(ctx, ls);
	if (ls2.usertype !== usertype)
		return null;
	return ls2.user;
}

sink_val sink_list_newblob(sink_ctx ctx, int size, const sink_val *vals){
	int count = size + sink_list_grow;
	sink_val *copy = mem_alloc(sizeof(sink_val) * count);
	if (size > 0)
		memcpy(copy, vals, sizeof(sink_val) * size);
	return sink_list_newblobgive(ctx, size, count, copy);
}

sink_val sink_list_newblobgive(sink_ctx ctx, int size, int count, sink_val *vals){
	if (vals === NULL || count === 0){
		opi_abort(ctx,
			"Native run-time error: sink_list_newblobgive() must be given a buffer with some "
			"positive count");
		if (vals)
			mem_free(vals);
		return SINK_NIL;
	}
	context ctx2 = ctx;
	int index = bmp_reserve((void **)&ctx2.list_tbl, &ctx2.list_size, &ctx2.list_aloc,
		&ctx2.list_ref, sizeof(sink_list_st));
	sink_list ls = &ctx2.list_tbl[index];
	ls.vals = vals;
	ls.size = size;
	ls.count = count;
	ls.user = NULL;
	ls.usertype = -1;
	return (sink_val){ .u = SINK_TAG_LIST | index };
}

export sink_val sink_list_cat(sink_ctx ctx, int size, sink_val *vals){
	for (int i = 0; i < size; i++){
		if (!sink_islist(vals[i])){
			opi_abortcstr(ctx, "Cannot concatenate non-lists");
			return SINK_NIL;
		}
	}
	return opi_list_cat(ctx, size, vals);
}
*/
export function sink_list_joinplain(vals: sink_list | sink_val[], sep: string): sink_val {
	var out = '';
	for (let i = 0; i < vals.length; i++)
		out += (i > 0 ? sep : '') + sink_tostr(vals[i]);
	return out;
}
/*
// pickle
sink_gc_level sink_gc_getlevel(sink_ctx ctx){
	return ((context)ctx).gc_level;
}

void sink_gc_setlevel(sink_ctx ctx, sink_gc_level level){
	((context)ctx).gc_level = level;
}

sink_val sink_abortstr(sink_ctx ctx, const char *fmt, ...){
	va_list args, args2;
	va_start(args, fmt);
	va_copy(args2, args);
	size_t s = vsnprintf(NULL, 0, fmt, args);
	char *buf = mem_alloc(s + 1);
	vsprintf(buf, fmt, args2);
	va_end(args);
	va_end(args2);
	opi_abort(ctx, buf);
	return SINK_NIL;
}

*/
