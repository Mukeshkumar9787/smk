// cartStorage.ts
export const loadCartFromStorage = () => {
  try {
    const serializedState = localStorage.getItem("cart");
    if (!serializedState) return {items: []};
    return JSON.parse(serializedState);
  } catch {
    return undefined;
  }
};

export const saveCartToStorage = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("cart", serializedState);
  } catch {
    // ignore write errors
  }
};