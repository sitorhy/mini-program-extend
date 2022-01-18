declare namespace extend {
    class EventArgs {
        originalSource: object;
        event: string;
        data: any;
        source: any;
    }

    class RoutedEventArgs extends EventArgs {
        handled: boolean;
    }

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
        props?: { [key: string]: PropOption };
        behaviors?: string[];
        data?: (() => object) | object;
        methods?: { [key: string]: (...args: any[]) => any };
        options?: object;
        created?: () => void;
        onShow?: () => void;
        onHide?: () => void;
        computed?: object;
        watch?: object;
        beforeCreate?: () => void;
        beforeMount?: () => void;
        mounted?: () => void;
        beforeDestroy?: () => void;
        destroyed?: () => void;
        provide?: () => object;
        inject?: () => object;
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

    class MPExtender {
        use<T extends OptionInstaller>(installer: T): void;

        extends(options: object): object;
    }

    class FrameworkInstaller {
        configuration(extender: MPExtender, context: Map<any, any>, options: object): object;

        install(extender: MPExtender, context: Map<any, any>, options: object): object;

        build(extender: MPExtender, context: Map<any, any>, options: object): object;
    }

    class BehaviorInstaller extends FrameworkInstaller {
        definitionFilter(extender: MPExtender, context: Map<any, any>, options: object, defFields: object, definitionFilterArr: ((defFields: object, definitionFilterArr?: object[]) => void)[]);

        behaviors(): string[];

        properties(): { [key: string]: PropOption };

        observers(): { [key: string]: (...newValues: any[]) => void };

        data(): (() => object) | object;

        methods(): { [key: string]: (...args: any[]) => any };

        ready(): void;

        moved(): void;

        options(): object;

        lifetimes(extender, context, options): Lifetimes;

        pageLifetimes(extender, context, options): PageLifetimes;

        externalClasses(): string[];

        relations(): ComponentRelation;
    }

    class OptionInstaller extends BehaviorInstaller {
        computed(): object;

        watch(): object;

        beforeCreate(): void;

        created(): void;

        beforeMount(): void;

        mounted(): void;

        beforeUpdate(extender: MPExtender, context: Map<any, any>, options: object, runtimeContext: object, data: object): void;

        updated(extender: MPExtender, context: Map<any, any>, options: object, runtimeContext: object, data: object): void;

        beforeDestroy(): void;

        destroyed(): void;

        provide(): object;

        inject(): object;

        $emit: (event: string, data: any) => void;

        $dispatch: (event: string, data: any) => void;

        $broadcast: (event: string, data: any) => void;

        $once: (event: string, listener: (event: string, data: RoutedEventArgs | EventArgs) => void) => void;

        $on: (event: string, listener: (event: string, data: RoutedEventArgs | EventArgs) => void) => void;

        $off: (event?: string, listener?: (event: string, data: RoutedEventArgs | EventArgs) => void) => void;
    }
}

export declare function PageEx<T extends extend.PageExOptions & object>(options: T): void;

export declare function ComponentEx<T extends extend.ComponentExOptions & object>(options: T): void;

export const Extension: {
    use: <T extends extend.OptionInstaller>(installer: T, priority?: number) => void;

    mixin: <T extends extend.Options>(mixin: T) => void;
};

export class MPExtender extends extend.MPExtender {
}

export class OptionInstaller extends extend.OptionInstaller {
}