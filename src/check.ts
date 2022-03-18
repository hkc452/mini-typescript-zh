import { Module, Statement, Type, Node, Expression, Identifier, TypeAlias } from './types'
import { error } from './error'
import { resolve } from './bind'
const stringType: Type = { id: "string" }
const numberType: Type = { id: "number" }
const errorType: Type = { id: "error" }
function typeToString(type: Type) {
    return type.id
}
// 检查类型
export function check(module: Module) {
    return module.statements.map(checkStatement)

    function checkStatement(statement: Statement): Type {
        switch (statement.kind) {
            case Node.ExpressionStatement:
                return checkExpression(statement.expr)
            case Node.Var:
                // 赋值语句里面可能还存在连续赋值
                const i = checkExpression(statement.init)
                if (!statement.typename) {
                    return i
                }
                const t = checkType(statement.typename)
                // 看看声明的类型跟赋值的类型是否一致
                if (t !== i && t !== errorType)
                    error(statement.init.pos, `Cannot assign initialiser of type '${typeToString(i)}' to variable with declared type '${typeToString(t)}'.`)
                return t
            case Node.TypeAlias:
                return checkType(statement.typename)
        }
    }

    function checkExpression(expression: Expression): Type {
        switch (expression.kind) {
            // 如果是标识符，找到他的声明
            case Node.Identifier:
                const symbol = resolve(module.locals, expression.text, Node.Var)
                if (symbol) {
                    // 找到他的值声明，然后进行类型检查
                    return checkStatement(symbol.valueDeclaration!)
                }
                error(expression.pos, "Could not resolve " + expression.text)
                return errorType
            case Node.Literal:
                // 默认字面量只有数字
                return numberType
            case Node.Assignment:
                // 连续赋值也要检查类型，连续赋值的 var a : number = b: number =1
                // 这里检测 b: number = 1
                const v = checkExpression(expression.value)
                const t = checkExpression(expression.name)
                if (t !== v)
                    error(expression.value.pos, `Cannot assign value of type '${typeToString(v)}' to variable of type '${typeToString(t)}'.`)
                // 返回 b 的 类型
                return t
        }
    }
    // 根据 typename 找到 正常的类型
    function checkType(name: Identifier): Type {
        switch (name.text) {
            case "string":
                return stringType
            case "number":
                return numberType
            default:
                // 如果是 TypeAlias 类型，往上找到真实类型
                const symbol = resolve(module.locals, name.text, Node.TypeAlias)
                if (symbol) {
                    return checkType((symbol.declarations.find(d => d.kind === Node.TypeAlias) as TypeAlias).typename)
                }
                error(name.pos, "Could not resolve type " + name.text)
                return errorType
        }
    }
}
