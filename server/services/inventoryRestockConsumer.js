/**
 * Autonomous Inventory Agent Event Consumer for E-Commerce Backend.
 *
 * Consumes stock replenishment / restock events produced by the autonomous procurement
 * agent system over Apache Kafka topic 'inventory-restock'. Updates store stock directly
 * in the database upon purchase order issuance, eliminating the need for an external HTTP restock endpoint.
 */

import { getKafkaConfig } from "../utils/kafkaConfig.js";
import productService from "./products.js";
import { isInventoryAgentEnabled } from "./inventoryAgentProducer.js";

let consumerInstance = null;
let isStarting = false;

/**
 * Start the Kafka consumer to listen for restock replenishment events from the agent system.
 */
export const startRestockConsumer = async () => {
  if (!isInventoryAgentEnabled()) {
    console.log("[RestockConsumer] Inventory Agent disabled. Skipping restock consumer initialization.");
    return null;
  }

  if (consumerInstance || isStarting) {
    return consumerInstance;
  }

  isStarting = true;

  try {
    const { Kafka } = await import("kafkajs");
    const kafkaConfig = getKafkaConfig("smk-backend-restock-consumer");
    const kafka = new Kafka(kafkaConfig);

    const groupId = process.env.KAFKA_RESTOCK_CONSUMER_GROUP_ID || "smk-backend-restock-group";
    const restockTopic = process.env.KAFKA_TOPIC_RESTOCK_EVENTS || "inventory-restock";

    const consumer = kafka.consumer({ groupId });
    await consumer.connect();
    console.log(`[RestockConsumer] Connected to Kafka broker as group '${groupId}'`);

    // Subscribe to the dedicated restock topic
    await consumer.subscribe({ topic: restockTopic, fromBeginning: false });
    console.log(`[RestockConsumer] Subscribed to replenishment topic: '${restockTopic}'`);

    consumerInstance = consumer;

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const rawValue = message.value?.toString();
          if (!rawValue) return;

          const event = JSON.parse(rawValue);
          console.log(`[RestockConsumer] Received event on topic '${topic}' [partition ${partition}]:`, event);

          // Identify restock action
          const isRestock =
            topic === restockTopic ||
            event.event_type === "STOCK_RESTOCK" ||
            event.action === "RESTOCK" ||
            Boolean(event.quantity || event.qty);

          if (!isRestock) {
            return;
          }

          const slug = event.slug || event.sku;
          const productId = event.productId || event.product_id || event.id;
          const rawQty = event.quantity ?? event.qty;
          const poNumber = event.poNumber || event.po_number || null;

          let quantity = parseInt(rawQty, 10);
          if (isNaN(quantity) || quantity <= 0) {
            console.warn(`[RestockConsumer] Ignored event with invalid quantity (${rawQty}):`, event);
            return;
          }

          // Enforce business constraint: quantity added per replenishment must be < 20
          if (quantity >= 20) {
            console.info(`[RestockConsumer] Capping quantity from ${quantity} to 19 (< 20 constraint)`);
            quantity = 19;
          }

          if (!slug && !productId) {
            console.warn("[RestockConsumer] Event missing product identifier (slug or productId):", event);
            return;
          }

          // Execute stock replenishment in store database
          const result = await productService.restockProduct({
            slug,
            productId,
            quantity,
            poNumber,
          });

          console.log(
            `[RestockConsumer] ✅ Stock replenished via Kafka: "${result.title}" (ID: ${result.productId}) +${result.addedQuantity} units. New stock: ${result.currentStock} (PO: ${result.poNumber || "N/A"})`
          );
        } catch (msgErr) {
          console.error("[RestockConsumer] Error processing restock event message:", msgErr.message);
        }
      },
    });

    return consumerInstance;
  } catch (err) {
    consumerInstance = null;
    console.warn("[RestockConsumer] Failed to initialize Kafka restock consumer:", err.message);
    return null;
  } finally {
    isStarting = false;
  }
};

/**
 * Stop and disconnect the Kafka restock consumer cleanly.
 */
export const stopRestockConsumer = async () => {
  if (!consumerInstance) return;
  try {
    const c = consumerInstance;
    consumerInstance = null;
    await c.stop();
    await c.disconnect();
    console.log("[RestockConsumer] Kafka consumer stopped and disconnected cleanly.");
  } catch (err) {
    console.warn("[RestockConsumer] Error stopping Kafka consumer:", err.message);
  }
};

export default {
  startRestockConsumer,
  stopRestockConsumer,
};
