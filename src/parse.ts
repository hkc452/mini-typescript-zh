import { Lexer, Token, Node, Statement, Identifier, Expression, Module } from './types'
import { error } from './error'
export function parse(lexer: Lexer): Module {
    // 开始扫描
    lexer.scan()
    return parseModule()

    function parseModule(): Module {
        // 以分号为切割符，尝试使用 parseStatement 获取所有的表达式
        const statements = parseSeparated(parseStatement, () => tryParseToken(Token.Semicolon))
        // 是不是结束符
        parseExpected(Token.EOF)
        return { statements, locals: new Map() }
    }
    // 
    function parseExpression(): Expression {
        const pos = lexer.pos()
        const e = parseIdentifierOrLiteral()
        // 如果 eg: var a = b = 1，看看下一个token 是不是等号
        if (e.kind === Node.Identifier && tryParseToken(Token.Equals)) {
            return { kind: Node.Assignment, name: e, value: parseExpression(), pos }
        }
        return e
    }
    // 解析字面量或者标识符
    function parseIdentifierOrLiteral(): Expression {
        const pos = lexer.pos()
        // 如果是标识符
        if (tryParseToken(Token.Identifier)) {
            return { kind: Node.Identifier, text: lexer.text(), pos }
        }
        // 如果是字面量
        else if (tryParseToken(Token.Literal)) {
            return { kind: Node.Literal, value: +lexer.text(), pos }
        }
        // 存储错误
        error(pos, "Expected identifier or literal but got " + Token[lexer.token()])
        // 继续往下扫描
        lexer.scan()
        // 当成没有扫描成功的标识符
        return { kind: Node.Identifier, text: "(missing)", pos }
    }
    function parseIdentifier(): Identifier {
        const e = parseIdentifierOrLiteral()
        if (e.kind === Node.Identifier) {
            return e
        }
        error(e.pos, "Expected identifier but got a literal")
        return { kind: Node.Identifier, text: "(missing)", pos: e.pos }
    }
    // 解析表达式
    function parseStatement(): Statement {
        const pos = lexer.pos()
        // 符合变量token
        if (tryParseToken(Token.Var)) {
            // 获取标识
            const name = parseIdentifier()
            // 尝试获取类型，如果声明后面是 冒号:
            const typename = tryParseToken(Token.Colon) ? parseIdentifier() : undefined
            // 期待等号
            parseExpected(Token.Equals)
            // 解析表达式
            const init = parseExpression()
            // 返回的AST
            return { kind: Node.Var, name, typename, init, pos }
        }
        // 符合 type token
        else if (tryParseToken(Token.Type)) {
            const name = parseIdentifier()
            parseExpected(Token.Equals)
            const typename = parseIdentifier()
            return { kind: Node.TypeAlias, name, typename, pos }
        }
        return { kind: Node.ExpressionStatement, expr: parseExpression(), pos }
    }
    // 当前 token 是否是期待的表达式
    function tryParseToken(expected: Token) {
        const ok = lexer.token() === expected
        // 如果符合，扫描下一个token
        if (ok) {
            lexer.scan()
        }
        return ok
    }
    // 不符合期待 Token，存储错误，相当于容忍解析过程中出现的错误
    function parseExpected(expected: Token) {
        if (!tryParseToken(expected)) {
            error(lexer.pos(), `parseToken: Expected ${Token[expected]} but got ${Token[lexer.token()]}`)
        }
    }
    // 返回所以的 表达式，以 separator 回调为切割符
    function parseSeparated<T>(element: () => T, separator: () => unknown) {
        const list = [element()]
        while (separator()) {
            list.push(element())
        }
        return list
    }
}