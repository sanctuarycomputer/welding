const expression = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const validateEmail = (email: string) => expression.test(email);
export default validateEmail;