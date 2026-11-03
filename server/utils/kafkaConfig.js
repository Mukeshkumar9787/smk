import fs from "fs";

/**
 * Build unified KafkaJS client configuration from environment variables.
 * Handles broker lists, SASL authentication, SSL with custom CA, and client mTLS certs.
 *
 * @param {string} clientId - Unique client identifier for Kafka connection
 * @returns {Object} KafkaJS configuration object
 */
export const getKafkaConfig = (clientId = "ecommerce-store-backend") => {
  const brokers = (process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092").split(",");
  const kafkaConfig = {
    clientId,
    brokers,
    retry: { retries: 3 },
  };

  // Configure SASL Authentication if credentials exist
  if (process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD) {
    const mechanism = (process.env.KAFKA_SASL_MECHANISM || "plain").toLowerCase();
    kafkaConfig.sasl = {
      mechanism,
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD,
    };
  }

  // Configure SSL & CA Certificate if SSL enabled or CA provided
  const isSslRequested =
    (process.env.KAFKA_SECURITY_PROTOCOL || "").toUpperCase().includes("SSL") ||
    Boolean(process.env.KAFKA_CA_PATH || process.env.KAFKA_CA_CERT) ||
    (process.env.KAFKA_USERNAME &&
      (process.env.KAFKA_SECURITY_PROTOCOL || "SASL_SSL").toUpperCase() !== "SASL_PLAINTEXT");

  if (isSslRequested) {
    let caCert = null;
    if (process.env.KAFKA_CA_PATH && fs.existsSync(process.env.KAFKA_CA_PATH)) {
      caCert = fs.readFileSync(process.env.KAFKA_CA_PATH, "utf-8");
    } else if (process.env.KAFKA_CA_CERT) {
      caCert = process.env.KAFKA_CA_CERT;
    }

    if (caCert) {
      kafkaConfig.ssl = {
        rejectUnauthorized: true,
        ca: [caCert],
      };
      if (process.env.KAFKA_CLIENT_CERT_PATH && fs.existsSync(process.env.KAFKA_CLIENT_CERT_PATH)) {
        kafkaConfig.ssl.cert = fs.readFileSync(process.env.KAFKA_CLIENT_CERT_PATH, "utf-8");
      }
      if (process.env.KAFKA_CLIENT_KEY_PATH && fs.existsSync(process.env.KAFKA_CLIENT_KEY_PATH)) {
        kafkaConfig.ssl.key = fs.readFileSync(process.env.KAFKA_CLIENT_KEY_PATH, "utf-8");
      }
    } else {
      kafkaConfig.ssl = true;
    }
  }

  return kafkaConfig;
};

export default {
  getKafkaConfig,
};
