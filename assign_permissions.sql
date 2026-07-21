-- Give super admin ALL permissions
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT
  gen_random_uuid(),
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.is_super_admin = true
ON CONFLICT DO NOTHING;

SELECT COUNT(*) as role_permissions_count
FROM role_permissions;
