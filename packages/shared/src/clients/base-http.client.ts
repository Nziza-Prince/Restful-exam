import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class BaseHttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string, serviceKey: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'X-Service-Key': serviceKey,
        'Content-Type': 'application/json',
      },
      timeout: 15_000,
    });
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(path, config);
    return response.data;
  }

  async post<T>(
    path: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(path, body, config);
    return response.data;
  }

  async put<T>(
    path: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(path, body, config);
    return response.data;
  }

  async patch<T>(
    path: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(path, body, config);
    return response.data;
  }

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(path, config);
    return response.data;
  }
}
