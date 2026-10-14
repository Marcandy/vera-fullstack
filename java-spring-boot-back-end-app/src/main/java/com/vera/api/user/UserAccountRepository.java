package com.vera.api.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    @Query("select u from UserAccount u left join fetch u.caregiver where u.email = :email")
    Optional<UserAccount> findByEmailWithCaregiver(@Param("email") String email);

    boolean existsByCaregiver_Id(Long caregiverId);
}
