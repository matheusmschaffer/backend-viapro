-- Adicionar a restrição de unicidade parcial para garantir apenas um vínculo FROTA por veículo
CREATE UNIQUE INDEX uix_one_frota_per_vehicle
ON "vehicle_account_associations" (vehicle_id)
WHERE association_type = 'FROTA';