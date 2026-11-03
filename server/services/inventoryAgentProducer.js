/**
 * Autonomous Inventory Agent Event Producer for E-Commerce Backend.
 * 
 * Publishes inventory stock decrement events to Apache Kafka topic 'inventory-events'.
 * Respects INVENTORY_AGENT_ENABLED / INVENTORY_AGENT environment variables.
 */

let kafkaProducer = null;

export const isInventoryAgentEnabled = () => {
  const enabledFlag = process.env.INVENTORY_AGENT_ENABLED;
  const aliasFlag = process.env.INVENTORY_AGENT;

  if (aliasFlag) {
    return ['enabled', 'true', '1'].includes(aliasFlag.trim().toLowerCase());
  }
  return enabledFlag === 'true' || enabledFlag === '1';
};

const getKafkaProducer = async () => {
  if (kafkaProducer) return kafkaProducer;

  try {
    const { Kafka } = await import('kafkajs');
    const brokers = (process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092').split(',');
    const kafkaConfig = {
      clientId: 'ecommerce-store-backend',
      brokers,
      retry: { retries: 3 },
    };

    // Configure SASL Authentication if credentials exist
    if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
      const mechanism = (process.env.KAFKA_SASL_MECHANISM || 'plain').toLowerCase();
      kafkaConfig.sasl = {
        mechanism,
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
      };
    }

    // Configure SSL & CA Certificate if SSL enabled or CA provided
    const isSslRequested = 
      (process.env.KAFKA_SECURITY_PROTOCOL || '').toUpperCase().includes('SSL') ||
      Boolean(process.env.KAFKA_CA_PATH || process.env.KAFKA_CA_CERT) ||
      (process.env.KAFKA_USERNAME && (process.env.KAFKA_SECURITY_PROTOCOL || 'SASL_SSL').toUpperCase() !== 'SASL_PLAINTEXT');

    if (isSslRequested) {
      const fs = await import('fs');
      let caCert = null;
      if (process.env.KAFKA_CA_PATH && fs.existsSync(process.env.KAFKA_CA_PATH)) {
        caCert = fs.readFileSync(process.env.KAFKA_CA_PATH, 'utf-8');
      } else if (process.env.KAFKA_CA_CERT) {
        caCert = process.env.KAFKA_CA_CERT;
      }

      if (caCert) {
        kafkaConfig.ssl = {
          rejectUnauthorized: true,
          ca: [caCert],
        };
        // Optional client certificates for mTLS
        if (process.env.KAFKA_CLIENT_CERT_PATH && fs.existsSync(process.env.KAFKA_CLIENT_CERT_PATH)) {
          kafkaConfig.ssl.cert = fs.readFileSync(process.env.KAFKA_CLIENT_CERT_PATH, 'utf-8');
        }
        if (process.env.KAFKA_CLIENT_KEY_PATH && fs.existsSync(process.env.KAFKA_CLIENT_KEY_PATH)) {
          kafkaConfig.ssl.key = fs.readFileSync(process.env.KAFKA_CLIENT_KEY_PATH, 'utf-8');
        }
      } else {
        kafkaConfig.ssl = true;
      }
    }

    const kafka = new Kafka(kafkaConfig);
    const producer = kafka.producer();
    await producer.connect();
    kafkaProducer = producer;
    console.log('[InventoryAgent] Connected to Apache Kafka broker at:', brokers.join(','));
    return kafkaProducer;
  } catch (err) {
    kafkaProducer = null;
    console.warn('[InventoryAgent] Kafka client connection warning:', err.message);
    return null;
  }
};

/**
 * Publish an inventory level change event when an item is ordered or stock drops.
 *
 * @param {Object} params
 * @param {number|string} [params.productId] - Store Product ID (e.g. 101)
 * @param {string} [params.productName] - Product title (e.g. "Classic Heavyweight Cotton T-Shirt")
 * @param {string} [params.sku] - Item identifier (defaults to PROD-<id>)
 * @param {number} params.currentStock - Remaining stock quantity
 * @param {number} [params.reorderThreshold=10] - Safety stock reorder threshold
 * @param {string} [params.eventId] - Unique event identifier
 */
export const publishInventoryEvent = async ({
  slug = null,
  productId = null,
  productName = null,
  sku = null,
  currentStock,
  reorderThreshold = 10,
  eventId = null,
}) => {
  if (!isInventoryAgentEnabled()) {
    console.log(`[InventoryAgent] Agent disabled. Skipping event for Product ${slug || productId || sku}.`);
    return null;
  }

  const itemIdentifier = slug || sku || (productId ? `PROD-${productId}` : 'ITEM-GENERAL');
  const itemSku = itemIdentifier;
  const title = productName || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : `Product #${productId || itemIdentifier}`);

  const payload = {
    event_id: eventId || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    sku: itemIdentifier,
    slug: slug || itemIdentifier,
    product_id: productId ? parseInt(productId, 10) : null,
    product_name: title,
    current_stock: parseInt(currentStock, 10),
    reorder_threshold: parseInt(reorderThreshold, 10),
  };

  const topic = process.env.KAFKA_TOPIC_INVENTORY_EVENTS || 'inventory-events';

  try {
    const producer = await getKafkaProducer();
    if (producer) {
      await producer.send({
        topic,
        messages: [
          {
            key: itemSku,
            value: JSON.stringify(payload),
          },
        ],
      });
      console.log(`[InventoryAgent] 🚀 Published event to Kafka '${topic}': "${title}" (Stock: ${currentStock} <= ${reorderThreshold})`);
    } else {
      console.log(`[InventoryAgent] [Local Log] Inventory event created for "${title}":`, payload);
    }

    // Also notify Mock ERP dashboard if reachable so UI immediately reflects it
    try {
      const erpUrl = process.env.MOCK_ERP_URL || 'http://localhost:8002';
      fetch(`${erpUrl}/api/v1/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'E-Commerce Store',
          event_type: 'ORDER_DECREMENT',
          title: `Checkout: ${title}`,
          description: `Customer order placed. Remaining stock: ${currentStock} (reorder threshold: ${reorderThreshold}).`,
          details: { product_name: title, stock: currentStock, threshold: reorderThreshold },
          sku: itemSku,
        }),
      }).catch(() => {});
    } catch (_) {}

    return payload;
  } catch (error) {
    kafkaProducer = null;
    console.error(`[InventoryAgent] Error publishing inventory event for SKU=${itemSku}:`, error.message);
    return null;
  }
};

export default {
  publishInventoryEvent,
  isInventoryAgentEnabled,
};
