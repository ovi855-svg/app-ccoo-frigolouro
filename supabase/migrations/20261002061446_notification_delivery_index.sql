-- Cover the subscription foreign key for device removal and expired endpoint cleanup.
create index notification_deliveries_subscription_idx
  on private.notification_deliveries(subscription_id);
