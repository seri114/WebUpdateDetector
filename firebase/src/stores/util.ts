

import { DatabaseStore } from "@/stores/database";
import { AuthStore } from "@/stores/auth";

export const getUid = (dbStore: DatabaseStore, authStore: AuthStore) => {
    const ret = dbStore.isSu.value ? (dbStore.state.userSetting.su ?? authStore.state.uid) : authStore.state.uid;
    return ret;
};