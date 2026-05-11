import type { HistoryGroup, LearningPackage } from "../shared/types";

const HISTORY_KEY = "weblearnboost:learningPackageHistory";

function rejectLastError(): Error | undefined {
  const message = chrome.runtime.lastError?.message;
  return message ? new Error(message) : undefined;
}

function storageGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      const error = rejectLastError();
      if (error) {
        reject(error);
        return;
      }

      resolve(items[key] as T | undefined);
    });
  });
}

function storageSet<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      const error = rejectLastError();
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function storageRemove(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      const error = rejectLastError();
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function byCreatedAtDesc(a: LearningPackage, b: LearningPackage): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function sortPackages(packages: LearningPackage[]): LearningPackage[] {
  return [...packages].sort(byCreatedAtDesc);
}

async function readHistory(): Promise<LearningPackage[]> {
  const saved = await storageGet<LearningPackage[]>(HISTORY_KEY);
  return sortPackages(saved ?? []);
}

async function writeHistory(packages: LearningPackage[]): Promise<LearningPackage[]> {
  const sorted = sortPackages(packages);
  await storageSet(HISTORY_KEY, sorted);
  return sorted;
}

export async function listLearningPackages(): Promise<LearningPackage[]> {
  return readHistory();
}

export async function saveLearningPackage(
  learningPackage: LearningPackage,
): Promise<LearningPackage> {
  const packages = await readHistory();
  const existingIndex = packages.findIndex((item) => item.id === learningPackage.id);

  if (existingIndex >= 0) {
    packages[existingIndex] = learningPackage;
  } else {
    packages.push(learningPackage);
  }

  await writeHistory(packages);
  return learningPackage;
}

export async function getLearningPackageById(
  packageId: string,
): Promise<LearningPackage | undefined> {
  const packages = await readHistory();
  return packages.find((item) => item.id === packageId);
}

export async function getLearningPackagesByUrl(url: string): Promise<LearningPackage[]> {
  const packages = await readHistory();
  return packages.filter((item) => item.url === url);
}

export async function getLatestLearningPackage(
  url: string,
): Promise<LearningPackage | undefined> {
  const versions = await getLearningPackagesByUrl(url);
  return versions[0];
}

export async function deleteLearningPackageVersion(packageId: string): Promise<boolean> {
  const packages = await readHistory();
  const next = packages.filter((item) => item.id !== packageId);

  if (next.length === packages.length) {
    return false;
  }

  await writeHistory(next);
  return true;
}

export async function clearLearningPackageHistory(): Promise<void> {
  await storageRemove(HISTORY_KEY);
}

export async function listHistoryGroups(): Promise<HistoryGroup[]> {
  const packages = await readHistory();
  const groupsByUrl = new Map<string, LearningPackage[]>();

  for (const learningPackage of packages) {
    const versions = groupsByUrl.get(learningPackage.url) ?? [];
    versions.push(learningPackage);
    groupsByUrl.set(learningPackage.url, versions);
  }

  return [...groupsByUrl.entries()]
    .map(([url, versions]) => {
      const sortedVersions = sortPackages(versions);
      const latest = sortedVersions[0];

      return {
        url,
        title: latest.title,
        latestCreatedAt: latest.createdAt,
        versions: sortedVersions,
      } satisfies HistoryGroup;
    })
    .sort((a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime());
}

