// Types for the DummyJSON login contract.
// See spec/apis_contract/01_Login_API_Contract.docx and spec/SPEC_FREEZE.md.

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  accessToken: string;
  refreshToken: string;
}
