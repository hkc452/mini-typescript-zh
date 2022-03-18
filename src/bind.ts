import { Module, Node, Statement, Table } from './types'
import { error } from './error'
export function bind(m: Module) {
    for (const statement of m.statements) {
        bindStatement(m.locals, statement)
    }
    // 绑定类型
    function bindStatement(locals: Table, statement: Statement) {
        // 如果是 变量表达式或者类型表达式
        if (statement.kind === Node.Var || statement.kind === Node.TypeAlias) {
            const symbol = locals.get(statement.name.text)
            if (symbol) {
                const other = symbol.declarations.find(d => d.kind === statement.kind)
                // 同个标识符不能声明两次相同类型
                if (other) {
                    error(statement.pos, `Cannot redeclare ${statement.name.text}; first declared at ${other.pos}`)
                }
                else {
                    /**
                     * type x : number
                     * int x : string = 1
                     * 只允许这种情况标识符重复
                     */
                    symbol.declarations.push(statement)
                    if (statement.kind === Node.Var) {
                        symbol.valueDeclaration = statement
                    }
                }
            }
            else {
                locals.set(statement.name.text, {
                    declarations: [statement], 
                    valueDeclaration: statement.kind === Node.Var ? statement : undefined
                })
            }
        }
    }
}
// 同个标识符找目标类型的声明
export function resolve(locals: Table, name: string, meaning: Node.Var | Node.TypeAlias) {
    const symbol = locals.get(name)
    if (symbol?.declarations.some(d => d.kind === meaning)) {
        return symbol
    }
}
