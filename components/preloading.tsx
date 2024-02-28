import { Preloaded, useConvexAuth, usePreloadedQuery } from 'convex/react';
import { FunctionReference, FunctionReturnType } from 'convex/server';
import { cloneElement, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';


interface AuthenticatedPreloadProps<
  P extends Preloaded<FunctionReference<'query'>>,
> {
  children: React.ReactElement<{ preloaded: FunctionReturnType<P['__type']> }>;
  preload: P;
}

const AuthenticatedPreload = <P extends Preloaded<FunctionReference<'query'>>>({
  children,
  preload,
}: AuthenticatedPreloadProps<P>) => {
  console.log("AuthenticatedPreload called...");
  const { isAuthenticated } = useConvexAuth();
  console.log("isAuthenticated: ", isAuthenticated);
  const output = useRef();
  console.log("output: ",output);
  const useHook = output.current === undefined || isAuthenticated;
  console.log("useHook: ", useHook);

  const { getToken, isLoaded, isSignedIn } = useAuth();
  console.log("getToken: ", getToken);
  console.log("isLoaded: ", isLoaded);
  console.log("isSignedIn: ", isSignedIn);



  const HookComponent = useCallback(
    ({
      children,
    }: {
      children: React.ReactElement<{
        preloaded: FunctionReturnType<P['__type']>;
      }>;
    }) => {
      output.current = usePreloadedQuery(preload);
      return cloneElement(children, { preloaded: output.current });
    },
    [],
  );

  return useHook ? (
    <HookComponent>{children}</HookComponent>
  ) : (
    cloneElement(children, { preloaded: output.current })
  );
};

export default AuthenticatedPreload;
