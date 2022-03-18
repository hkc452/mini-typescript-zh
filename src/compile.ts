import { Error, Module } from "./types"
import { errors } from './error'
import { lex } from "./lex"
import { parse } from "./parse"
import { bind } from "./bind"
import { check } from "./check"
import { transform } from "./transform"
import { emit } from "./emit"

export function compile(s: string): [Module, Error[], string] {
    // 清除所以错误
    errors.clear()
    // 扫描解析
    const tree = parse(lex(s))
    // 相同标识符进行绑定
    bind(tree)
    // 检查类型
    check(tree)
    // 生成 js 文件
    const js = emit(transform(tree.statements))
    return [tree, Array.from(errors.values()), js]
}
