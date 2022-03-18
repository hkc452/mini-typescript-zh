import { Statement, Node, Expression } from './types'
export function emit(statements: Statement[]) {
    return statements.map(emitStatement).join(";\n")
}
// 生成 js，但是transform 那里把类型 跟 typealias 都去掉了
function emitStatement(statement: Statement): string {
    switch (statement.kind) {
        case Node.ExpressionStatement:
            return emitExpression(statement.expr)
        case Node.Var:
            // 应该是 statement.typename.text 而不是 statement.name
            const typestring = statement.typename ? ": " + statement.name : ""
            return `var ${statement.name.text}${typestring} = ${emitExpression(statement.init)}`
        case Node.TypeAlias:
            return `type ${statement.name.text} = ${statement.typename.text}`
    }
}
function emitExpression(expression: Expression): string {
    switch (expression.kind) {
        case Node.Identifier:
            return expression.text
        case Node.Literal:
            return ""+expression.value
        case Node.Assignment:
            return `${expression.name.text} = ${emitExpression(expression.value)}`
    }
}

