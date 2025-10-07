package com.kozimor.wms.Database.Controller;

import com.kozimor.wms.Database.Model.Role;
import com.kozimor.wms.Database.Service.RoleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @PostMapping
    public ResponseEntity<Role> createRole(@Valid @RequestBody Role role) {
        Role createdRole = roleService.createRole(role);
        return new ResponseEntity<>(createdRole, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Role>> getAllRoles() {
        List<Role> roles = roleService.getAllRoles();
        return ResponseEntity.ok(roles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        return roleService.getRoleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/name/{roleName}")
    public ResponseEntity<Role> getRoleByName(@PathVariable String roleName) {
        return roleService.getRoleByName(roleName)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Role> updateRole(@PathVariable Long id, @Valid @RequestBody Role role) {
        try {
            Role updatedRole = roleService.updateRole(id, role);
            return ResponseEntity.ok(updatedRole);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        try {
            roleService.deleteRole(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}