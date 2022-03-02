import Store, {Connector} from "./libs/Store";

export const mapState = Connector.mapState;

export const mapGetters = Connector.mapGetters;

export const mapActions = Connector.mapActions;

export const mapMutations = Connector.mapMutations;

export const createNamespacedHelpers = Connector.createNamespacedHelpers;

export default Store;