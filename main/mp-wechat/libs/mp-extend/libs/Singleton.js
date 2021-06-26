export class Singleton {
    _instance = undefined;

    _constructor = function () {
        return null;
    };

    constructor(constructor) {
        this._constructor = constructor;
    }

    /**
     * @param {any?} arguments
     * @returns {undefined}
     */
    get() {
        if (this._instance === undefined) {
            this._instance = this._constructor.apply(undefined, arguments);
        }
        return this._instance;
    }

    release() {
        this._instance = undefined;
    }
}