package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.Role;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public interface RoleService {
    
    /**
     * Create a new role
     * @param role The role to create
     * @return The created role
     */
    Role createRole(Role role);

    /**
     * Get all roles
     * @return List of all roles
     */
    List<Role> getAllRoles();

    /**
     * Get a role by its ID
     * @param id The ID of the role to find
     * @return The role if found, otherwise empty Optional
     */
    Optional<Role> getRoleById(Long id);

    /**
     * Get a role by its name
     * @param roleName The name of the role to find
     * @return The role if found, otherwise empty Optional
     */
    Optional<Role> getRoleByName(String roleName);

    /**
     * Update an existing role
     * @param id The ID of the role to update
     * @param role The updated role data
     * @return The updated role
     */
    Role updateRole(Long id, Role role);

    /**
     * Delete a role by its ID
     * @param id The ID of the role to delete
     */
    void deleteRole(Long id);
}
