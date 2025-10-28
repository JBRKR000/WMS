package com.kozimor.wms.Database.Model.DTO;

import lombok.*;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRoleRequest {
    @NotBlank(message = "Role name cannot be blank")
    private String roleName;
}
