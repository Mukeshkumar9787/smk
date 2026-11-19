import { getKafkaConfig } from "../utils/kafkaConfig.js";

let kafkaProducer = null;
const TOPIC_TENANT_LIFECYCLE =
  process.env.KAFKA_TOPIC_TENANT_LIFECYCLE || "smk.tenant.lifecycle";

/**
 * Initializes or returns existing Kafka Producer instance
 */
async function getProducer() {
  if (kafkaProducer) return kafkaProducer;
  try {
    const { Kafka } = await import("kafkajs");
    const kafkaConfig = getKafkaConfig("smk-tenant-lifecycle-producer");
    const kafka = new Kafka(kafkaConfig);
    const producer = kafka.producer();
    await producer.connect();
    console.log("[Kafka Tenant Producer] Connected to Kafka brokers.");
    kafkaProducer = producer;
    return kafkaProducer;
  } catch (err) {
    console.warn(
      "[Kafka Tenant Producer] Could not connect to Kafka brokers:",
      err.message
    );
    kafkaProducer = null;
    return null;
  }
}

/**
 * Direct HTTP Webhook fallback to Chatbot Service
 */
async function directHttpSync(payload) {
  const chatbotBaseUrl =
    process.env.CHATBOT_SERVICE_URL ||
    process.env.NEXT_PUBLIC_CHATBOT_URL ||
    "https://chatbot-service-three.vercel.app";
  const internalKey =
    process.env.INTERNAL_SERVICE_KEY || "internal_rag_secret_key_123";

  try {
    const res = await fetch(`${chatbotBaseUrl.replace(/\/+$/, "")}/api/sync/tenant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Service-Key": internalKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(
        `[Tenant HTTP Sync Warning] HTTP status ${res.status}: ${errText}`
      );
    } else {
      console.log(
        `[Tenant HTTP Sync Success] Synced ${payload.slug} (${payload.event}) to Chatbot Service.`
      );
    }
  } catch (err) {
    console.warn(
      `[Tenant HTTP Sync Notice] Chatbot service at ${chatbotBaseUrl} not reachable directly:`,
      err.message
    );
  }
}

/**
 * Publishes tenant lifecycle event to Kafka and direct HTTP fallback
 *
 * @param {Object} eventData
 * @param {string} eventData.event - 'TENANT_CREATED' | 'TENANT_PLAN_UPDATED' | 'TENANT_STATUS_UPDATED'
 * @param {string} eventData.tenantId
 * @param {string} eventData.slug
 * @param {string} eventData.name
 * @param {string} eventData.status
 * @param {boolean} eventData.aiChatbotEnabled
 * @param {string} [eventData.planCode]
 */
export async function emitTenantLifecycleEvent(eventData) {
  const payload = {
    ...eventData,
    timestamp: new Date().toISOString(),
  };

  // 1. Direct HTTP Sync to ensure immediate UI and database update
  directHttpSync(payload).catch((e) =>
    console.warn("[Tenant Direct Sync Error]:", e.message)
  );

  // 2. Publish to Kafka Topic for durable event streaming
  try {
    const producer = await getProducer();
    if (producer) {
      await producer.send({
        topic: TOPIC_TENANT_LIFECYCLE,
        messages: [
          {
            key: String(payload.tenantId || payload.slug),
            value: JSON.stringify(payload),
          },
        ],
      });
      console.log(
        `[Kafka Tenant Producer] Emitted ${payload.event} for tenant ${payload.slug} to ${TOPIC_TENANT_LIFECYCLE}`
      );
    }
  } catch (err) {
    console.warn(
      "[Kafka Tenant Producer] Failed to publish message to Kafka:",
      err.message
    );
  }
}

export default {
  emitTenantLifecycleEvent,
};
