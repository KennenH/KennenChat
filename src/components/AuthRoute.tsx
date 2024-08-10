import { getTokenLocal } from "@/utils"
import { Navigate, replace } from "react-router-dom";

const AuthRoute = ({ children }: any) => {
  const token = getTokenLocal();
  if (token) {
    return (
      <>
        {children}
      </>
    );
  }
  return <Navigate to={'/login'} replace />
}

export default AuthRoute;