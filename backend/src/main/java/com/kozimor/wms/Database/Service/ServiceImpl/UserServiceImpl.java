package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Model.Role;
import com.kozimor.wms.Database.Model.DTO.UserDTO;
import com.kozimor.wms.Database.Model.DTO.PageResponse;
import com.kozimor.wms.Database.Repository.UserRepository;
import com.kozimor.wms.Database.Repository.RoleRepository;
import com.kozimor.wms.Database.Service.UserService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserServiceImpl(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }


    @Override
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserDTO> getAllUsersPaginated(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        
        List<UserDTO> userDTOs = page.getContent().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        
        return PageResponse.<UserDTO>builder()
            .content(userDTOs)
            .pageNumber(page.getNumber())
            .pageSize(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .isFirst(page.isFirst())
            .isLast(page.isLast())
            .hasNext(page.hasNext())
            .hasPrevious(page.hasPrevious())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        user.setFirstName(userDetails.getFirstName());
        user.setLastName(userDetails.getLastName());

        return userRepository.save(user);
    }

    @Override
    public User updateUserRole(Long id, String roleName) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        Role role = roleRepository.findByRoleName(roleName)
            .orElseThrow(() -> new EntityNotFoundException("Role not found with name: " + roleName));

        user.setRole(role);
        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    @Override
    public boolean isAdmin(Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return "ROLE_ADMIN".equalsIgnoreCase(user.getRole().getRoleName());
        }
        throw new EntityNotFoundException("User not found with id: " + id);
    }

    @Override
    public long getUserCount() {
        return userRepository.count();
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