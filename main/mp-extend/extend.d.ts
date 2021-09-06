declare namespace extend {
    interface Options {
        data: () => { [key: string]: any } | { [key: string]: any }
    }
}

export declare function PageEx<T extends extend.Options & object>(
    page: T
): void;