declare namespace extend {
    type State = { [key: string]: any };
    type Options = { [key: string]: any };
    type Getters = { [key: string]: any };
    type GetterHandler = (state: State, getters: Getters) => void;
    type MutationHandler = (state: State, payload: any) => void;
    type ActionHandler = (context: ActionContext, payload: any) => void;
    type PluginHandler = (store: Store) => void;
    type Payload = { type: string; } & { [key: string]: any };
    type NamespaceMapHelper = {
        mapState: (map?: string[] | { [prop: string]: (state: extend.State) => any }) => { [prop: string]: () => any },
        mapGetters: (map?: string[] | { [prop: string]: string }) => { [prop: string]: () => any },
        mapActions: (map?: string[] | { [prop: string]: string }) => { [prop: string]: () => Promise<any> },
        mapMutations: (map?: string[] | { [prop: string]: string }) => { [prop: string]: () => void }
    }

    class ActionContext {
        commit: (mutation: string | Payload, payload?: any, options?: Options) => void;
        dispatch: (action: string | Payload, payload?: any, options?: Options) => Promise<any>;
        getters: Getters;
        state: State;
        rootGetters: Getters;
        rootState: State;
    }

    class Module {
        state: State | (() => State);
        getters?: { [prop: string]: GetterHandler };
        mutations?: { [prop: string]: MutationHandler };
        actions?: { [prop: string]: ActionHandler };
        modules?: { [path: string]: Module };
        plugins: PluginHandler[];
    }

    class Store {
        commit: (mutation: string | Payload, payload?: any, options?: Options) => void;
        dispatch: (action: string | Payload, payload?: any, options?: Options) => Promise<any>;
        replaceState: (state: State) => void;
        watch: (fn: (state: State, getters: Getters) => void, callback: (value: any, oldValue: any) => void, options?: Options) => (() => void);
        subscribe: (handler: (mutation: { type: string, payload: any }, state: State) => void, options?: Options) => (() => void);
        subscribeAction: (handler: (action: { type: string, payload: any }, state: State) => void, options?: Options) => (() => void);
        registerModule: (path: string | string[], module: Module, options?: Options) => void;
        unregisterModule: (path: string | string[]) => void;
        hasModule: (path: string | string[]) => boolean;
        hotUpdate: (module: Module) => void;
    }
}

export function createStore(options: extend.Module): extend.Store;

export function mapState(namespace: string, map?: string[] | { [prop: string]: (state: extend.State) => any }): { [prop: string]: () => any };

export function mapState(map?: string[] | { [prop: string]: (state: extend.State) => any }): { [prop: string]: () => any };

export function mapGetters(namespace: string, map?: string[] | { [prop: string]: string }): { [prop: string]: () => any };

export function mapGetters(map?: string[] | { [prop: string]: string }): { [prop: string]: () => any };

export function mapActions(namespace: string, map?: string[] | { [prop: string]: string }): { [prop: string]: () => Promise<any> };

export function mapActions(map?: string[] | { [prop: string]: string }): { [prop: string]: () => Promise<any> };

export function mapMutations(namespace: string, map?: string[] | { [prop: string]: string }): { [prop: string]: () => void };

export function mapMutations(map?: string[] | { [prop: string]: string }): { [prop: string]: () => void };

export function createNamespacedHelpers(namespace: string): extend.NamespaceMapHelper;
