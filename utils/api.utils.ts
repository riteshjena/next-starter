import { API_ROUTES } from "@constants/api.constants";

import STUBS from "@stubs";

export enum RequestMethods {
  GET = "GET",
  PUT = "PUT",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export interface RequestOptions {
  method: RequestMethods;
  headers: {
    "Content-Type": string;
  };
  body?: string;
}

export interface NextOptions {
  cache?: "no-store" | "force-cache";
  next?: {
    revalidate: number | false;
  };
}

export interface RequestParams {
  pathParams?: Record<string, any>;
  queryParams?: Record<string, any>;
}

const getRequestUrl = (path: string, params: RequestParams) => {
  let url = API_ROUTES[path];

  if (!url || !url.trim().length) {
    return;
  }

  url = process.env.API_BASE + url;

  if (params?.pathParams) {
    for (const [key, value] of Object.entries(params.pathParams)) {
      url = url.replace(`:${key}`, value);
    }
  }

  if (params?.queryParams) {
    url += `?${new URLSearchParams(params.queryParams).toString()}`;
  }

  return url;
};

/*
    [TODO_RITESH]
    1. Integrate the right headers and token, use next-headers
    2. Intergrate next config for caching and other features
    3. Integrate a global error interceptor and a logger service
*/
export const createAPIRequest = async (
  path: string,
  params: RequestParams = {},
  nextOptions: NextOptions = {},
  method: RequestMethods = RequestMethods.GET,
  isMock: boolean = true,
  useCustomErrorHandler = false,
  payload?: any
): Promise<any> => {
  if (isMock && STUBS[path]) {
    return Promise.resolve(STUBS[path]);
  }

  /* integrate loggers for all errors */
  const url = getRequestUrl(path, params);

  if (!url || !url.trim().length) {
    return Promise.reject("URL parameter missing");
  }

  const requestOptions: RequestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    if (payload) {
      requestOptions.body = JSON.stringify(payload);
    }

    const response: Response = await fetch(url, {
      method,
      ...nextOptions,
    });

    if (!response?.ok) {
      if (useCustomErrorHandler) {
        /* soft error; pass error info to calling function */
        return Promise.reject();
      }

      /* will be caught by global error handler */
      /* decide contract for error from backend */
      throw new Error("Request failed.");
    }

    return response.json();
  } catch (error: any) {
    throw error;
  }
};
