export interface DownloaderHelperExtension {
  πname: string;
  πcontentId: string;
  πcompleted: boolean;
  πresigner: number;
  πremoteIp: string;
  πprogress: any;
}

export interface ServerConfig {
  downloadTmpDir: string;
  ip: string;
  packagesFolder: string;
  pendingDownloads: string;
  port: number;
  initialized: boolean;
  gametdb: boolean;
  isDev: boolean;
  ps3netservFolder: string;
  ps3netservPort: string;
}

export interface PendingDownload {
  fileName: string;
  url: string;
  contentId: string;
  name: string;
  rap: string;
  type: string;
  region: string;
  remoteIp: string;
}
