import { Statement, Node } from './types'
export function transform(statements: Statement[]) {
    return typescript(statements)
}
/** Convert TS to JS: remove type annotations and declarations */
function typescript(statements: Statement[]) {
    return statements.flatMap(transformStatement)

    // 把 AST 中的 类型声明 跟 TypeAlias 去掉
    function transformStatement(statement: Statement): Statement[] {
        switch (statement.kind) {
            case Node.ExpressionStatement:
                return [statement]
            case Node.Var:
                return [{ ...statement, typename: undefined }]
            case Node.TypeAlias:
                return []
        }
    }
}
