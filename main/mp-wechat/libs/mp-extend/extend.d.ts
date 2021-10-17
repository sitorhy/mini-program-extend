declare namespace extend {
    type PropType = string | number | boolean | object;

    type VuePropOption<T> = {
        type: { new(): T } | { new(): T | PropType }[];
        default: (() => T | PropType) | T | PropType;
        required?: boolean;
        validator?: (value: T) => boolean;
    };

    type WXMAPropOption<T> = {
        type: { new(): T };
        value: T;
        optionalTypes?: { new(): T | PropType }[];
        observer?: (newVal: T | PropType, oldVal: T | PropType, changedPath?: string) => void;
    };

    interface ComponentRelation {
        type: "parent" | "child" | "ancestor" | "descendant";
        target?: string;
        linked?: (target: object) => void;
        linkChanged?: (target: object) => void;
        unlinked?: (target: object) => void;
    }

    interface PageLifetimes {
        show?: () => void;
        hide?: () => void;
    }

    interface Lifetimes {
        created?: () => void;
        attached?: () => void;
        ready?: () => void;
        moved?: () => void;
        detached?: () => void;
    }

    type PropOption = VuePropOption<PropType> | WXMAPropOption<PropType>;

    interface Options {
        mixins?: Options[],
        properties?: { [key: string]: PropOption };
        behaviors?: string[];
        data?: (() => object) | object;
        methods?: { [key: string]: (...args: any[]) => any };
        options?: object;
        created?: () => void;
        onShow?: () => void;
        onHide?: () => void;
    }

    interface PageExOptions extends Options {
        onLoad?: (options: object) => void;
        onReady?: () => void;
        onUnload?: () => void;
        onPullDownRefresh?: () => void;
        onReachBottom?: () => void;
        onShareAppMessage?: (options?: object) => object;
        onShareTimeline?: () => object;
        onAddToFavorites?: (options?: object) => object;
        onResize?: (options?: object) => object;
        onSaveExitState?: () => void;
        onPageScroll?: (options: object) => void;
        onTabItemTap?: (options: object) => void;
    }

    interface ComponentExOptions extends Options {
        observers?: { [key: string]: (...newValues: any[]) => void };
        attached?: () => void;
        ready?: () => void;
        moved?: () => void;
        detached?: () => void;
        relations?: { [key: string]: ComponentRelation };
        externalClasses?: string[];
        lifetimes?: Lifetimes;
        pageLifetimes?: PageLifetimes;
        definitionFilter?: (defFields: object, definitionFilterArr?: object[]) => void;
    }
}

export declare function PageEx<T extends extend.PageExOptions & object>(options: T): { [key: string]: any };

export declare function ComponentEx<T extends extend.ComponentExOptions & object>(options: T): { [key: string]: any };