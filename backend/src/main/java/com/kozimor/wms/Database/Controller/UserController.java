package com.kozimor.wms.Database.Controller;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Model.DTO.UserDTO;
import com.kozimor.wms.Database.Model.DTO.PageResponse;
import com.kozimor.wms.Database.Model.DTO.UpdateUserRoleRequest;
import com.kozimor.wms.Database.Model.DTO.UpdateUserRequest;
import com.kozimor.wms.Database.Service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;


    public UserController(UserService userService) {
        this.userService = userService;
    }


    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/paginated")
    public ResponseEntity<PageResponse<UserDTO>> getAllUsersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<UserDTO> response = userService.getAllUsersPaginated(pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/employee-id")
    public ResponseEntity<String> getUserEmployeeId(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(user.getEmployeeId()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserDTO> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        try {
            User updatedUser = userService.updateUserRole(id, request.getRoleName());
            UserDTO userDTO = convertToDTO(updatedUser);
            return ResponseEntity.ok(userDTO);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        try {
            User updatedUser = userService.updateUser(id, request.toUser());
            UserDTO userDTO = convertToDTO(updatedUser);
            return ResponseEntity.ok(userDTO);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("isAdmin/{id}")
    public boolean isAdmin(@PathVariable Long id) {
        return userService.isAdmin(id);
    }

    @GetMapping("/getUserCount")
    public String getUserCount() {
        long count = userService.getUserCount();
        return String.valueOf(count);
    }

    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole() != null ? user.getRole().getRoleName() : null)
                .build();
    }

}