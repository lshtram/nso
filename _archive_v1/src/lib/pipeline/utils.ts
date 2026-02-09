/**
 * strict concurrency limiter (like p-limit)
 */
export const pLimit = <T>(concurrency: number, tasks: (() => Promise<T>)[]) => {
  let index = 0;
  const results: T[] = [];
  const active: Promise<void>[] = [];

  return new Promise<T[]>((resolve, reject) => {
    const next = () => {
      if (index >= tasks.length) {
        if (active.length === 0) resolve(results);
        return;
      }

      const taskIndex = index++;
      const promise = tasks[taskIndex]();
      const storedPromise = promise.then(res => {
          results[taskIndex] = res;
          active.splice(active.indexOf(storedPromise), 1);
          next();
      }).catch(err => {
         // Decide if we want to fail fast or return null. 
         // For pipeline, usually we want to absorb errors.
         console.error(`Task ${taskIndex} failed`, err);
         results[taskIndex] = null as any; 
         active.splice(active.indexOf(storedPromise), 1);
         next();
      });

      active.push(storedPromise);
    };

    // Start initial batch
    for (let i = 0; i < concurrency && i < tasks.length; i++) {
      next();
    }
    
    // Handle empty case
    if (tasks.length === 0) resolve([]);
  });
};
