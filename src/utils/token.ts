
const TOKEN_KEY = 'token_key';

const setTokenLocal = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
}

const getTokenLocal = () => {
    return localStorage.getItem(TOKEN_KEY);
}

const removeTokenLocal = () => {
    localStorage.removeItem(TOKEN_KEY);
}

export { setTokenLocal, getTokenLocal, removeTokenLocal };