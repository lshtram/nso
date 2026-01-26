
import { getAggregatedNews } from './src/lib/actions/news';

async function test() {
  console.log("Testing Production Pipeline...");
  try {
    const weights = { TECH: 85, SCIENCE: 30 };
    const { clusters, activeBrain } = await getAggregatedNews(weights, true, 'Neutral Brief');
    console.log(`Active Brain: ${activeBrain}`);
    console.log(`Clusters Found: ${clusters.length}`);
    if (clusters.length > 0) {
      console.log(`First Cluster: ${clusters[0].title}`);
    }
  } catch (e) {
    console.error("Pipeline Failed:", e);
  }
}

test();
