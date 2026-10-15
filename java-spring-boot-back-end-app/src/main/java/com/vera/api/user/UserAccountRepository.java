package com.vera.api.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    @Query("select u from UserAccount u left join fetch u.caregiver where u.email = :email")
    Optional<UserAccount> findByEmailWithCaregiver(@Param("email") String email);

    // Revalidate access without loading password hashes into the request.
    @Query("""
            select u.enabled as enabled, u.role as role, c.id as caregiverId
            from UserAccount u left join u.caregiver c where u.id = :id
            """)
    Optional<SessionAccount> findSessionAccountById(@Param("id") Long id);

    boolean existsByCaregiver_Id(Long caregiverId);

    interface SessionAccount {
        boolean isEnabled();

        Role getRole();

        Long getCaregiverId();
    }
}
