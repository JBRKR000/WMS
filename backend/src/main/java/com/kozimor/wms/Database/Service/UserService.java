package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Model.DTO.UserDTO;
import com.kozimor.wms.Database.Model.DTO.PageResponse;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Service
public interface UserService {

    /**
     * Get all users
     * @return List of all users
     */
    List<User> getAllUsers();

    /**
     * Get paginated users as DTOs
     * @param pageable Pagination information
     * @return PageResponse containing UserDTOs
     */
    PageResponse<UserDTO> getAllUsersPaginated(Pageable pageable);

    /**
     * Get a user by their ID
     * @param id The ID of the user to find
     * @return The user if found, otherwise empty Optional
     */
    Optional<User> getUserById(Long id);

    /**
     * Get a user by their username
     * @param username The username of the user to find
     * @return The user if found, otherwise empty Optional
     */
    Optional<User> getUserByUsername(String username);

    /**
     * Get a user by their email
     * @param email The email of the user to find
     * @return The user if found, otherwise empty Optional
     */
    Optional<User> getUserByEmail(String email);

    /**
     * Update an existing user
     * @param id The ID of the user to update
     * @param user The updated user data
     * @return The updated user
     */
    User updateUser(Long id, User user);

    /**
     * Update user role by role name
     * @param id The ID of the user to update
     * @param roleName The name of the role to assign
     * @return The updated user
     */
    User updateUserRole(Long id, String roleName);

    /**
     * Delete a user by their ID
     * @param id The ID of the user to delete
     */
    void deleteUser(Long id);

    boolean isAdmin(Long id);
    long getUserCount();
}
