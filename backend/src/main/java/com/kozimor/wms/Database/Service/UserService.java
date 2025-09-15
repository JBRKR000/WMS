package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.User;
import org.springframework.stereotype.Service;

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
     * Delete a user by their ID
     * @param id The ID of the user to delete
     */
    void deleteUser(Long id);
}
