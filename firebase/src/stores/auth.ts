
import firebase from "firebase/app";
import {getAuth, signInWithRedirect, GoogleAuthProvider, updateProfile, User} from 'firebase/auth'
import { inject, InjectionKey, reactive, readonly } from "vue";

const authStore = () => {
  console.log('init authStore')
  const state = reactive({ admin: false, isLoggedin: false, displayName: '', photoURL: '', uid: '', email: '', user: false, tryLogin: localStorage.getItem("loading")==="true"})
  const setUser = async (user: User | null) => {
    state.isLoggedin = !!user
    console.log("setUser" + user)
    localStorage.setItem("loading", "false");
    
    if (user != null) {
      const getIdTokenResult = await user.getIdTokenResult()
      console.log(getIdTokenResult)
      state.displayName = user.displayName ?? ''
      state.photoURL = user.photoURL ?? ''
      state.uid = user.uid ?? ''
      state.email = user.email ?? ''
      state.tryLogin = false;
      state.admin = Boolean(getIdTokenResult.claims.admin).valueOf();
      state.user = Boolean(getIdTokenResult.claims.user).valueOf();
    }
  }
  const signin = async () => {
    const provider = new GoogleAuthProvider();
    console.log("state.tryLogin = true;")
    localStorage.setItem("loading", "true")
    window.location.hash = "redirecting"
    signInWithRedirect(getAuth(), provider)
  }
  const signout = () => getAuth().signOut()
  const updateUser = (input: { displayName?: string; photoURL?: string }) => {
    
    updateProfile(getAuth().currentUser!, input)
      .then(() => setUser(getAuth().currentUser)
    )
  }

  getAuth().onAuthStateChanged((user) => setUser(user))

  return {
    state : readonly(state),
    setUser,
    signin,
    signout,
    updateUser,
  };
}

export default authStore

export type AuthStore = ReturnType<typeof authStore>;

export const authStoreKey: InjectionKey<AuthStore> = Symbol('authStore');

export const useAuthStore = () => {
  const store = inject(authStoreKey);
  if (!store) {
    throw new Error(`${authStoreKey} is not provided`);
  }
  return store;
}